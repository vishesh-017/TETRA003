import {
  getStore,
  IDS,
  newId,
  todayKey,
  updateStore,
  type CareTaskRow,
  type TaskStatus,
} from "@/data/store";
import { getSupabaseClient } from "@/lib/supabase";
import { env } from "@/config/env";

import type {
  ActiveCarePlanView,
  AppointmentView,
  CarePlanTimeline,
  CheckInInput,
  MedicineView,
  NotificationView,
  PassportView,
  PatientProfileView,
  RecoveryView,
  TodayDashboard,
  TodayTask,
} from "./types";

const PERIOD_LABELS: Record<TodayTask["period"], string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

function resolvePatientId(userId: string): string {
  const store = getStore();
  const patient = store.patients.find((p) => p.user_id === userId);
  if (patient) return patient.id;
  // Demo fallback: Patient role always maps to primary demo patient
  if (userId === IDS.patientUser || userId.endsWith("0002")) return IDS.patient;
  throw new Error("Patient profile not found");
}

function daysUntil(isoDate: string): number {
  const target = new Date(isoDate);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

function mapTasks(patientId: string, date = todayKey()): TodayTask[] {
  const store = getStore();
  const activePlan = store.carePlans.find(
    (c) => c.patient_id === patientId && c.status === "active",
  );
  const completions = store.taskCompletions.filter(
    (c) => c.patient_id === patientId && c.date === date,
  );
  return store.careTasks
    .filter(
      (t) =>
        t.patient_id === patientId &&
        t.active &&
        (!activePlan || t.care_plan_id === activePlan.id),
    )
    .sort((a, b) => a.sort_order - b.sort_order || a.period.localeCompare(b.period))
    .map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      period: t.period,
      sort_order: t.sort_order,
      status: (completions.find((c) => c.task_id === t.id)?.status ??
        "pending") as TaskStatus,
    }));
}

function progressFromTasks(tasks: TodayTask[]): number {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.status === "completed").length;
  return Math.round((done / tasks.length) * 100);
}

async function refreshScoresFromEngine(patientId: string) {
  const { syncScoresFromEngine } = await import(
    "@/modules/health-pipeline/process-checkin"
  );
  syncScoresFromEngine(patientId);
}

async function syncTaskToSupabase(
  patientId: string,
  taskId: string,
  status: TaskStatus,
) {
  if (!env.isSupabaseConfigured) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const date = todayKey();
  await supabase.from("task_completions").upsert(
    {
      patient_id: patientId,
      task_id: taskId,
      date,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "patient_id,task_id,date" },
  );
}

export const patientRepository = {
  resolvePatientId,

  getTodayDashboard(userId: string): TodayDashboard {
    const store = getStore();
    const patientId = resolvePatientId(userId);
    const patient = store.patients.find((p) => p.id === patientId)!;
    const profile = store.profiles.find((p) => p.id === patient.user_id)!;
    const tasks = mapTasks(patientId);
    const recoveryRow = store.recoveryScores.find(
      (r) => r.patient_id === patientId,
    );
    const riskRow = store.risks.find((r) => r.patient_id === patientId);
    const hasCheckins = store.checkins.some((c) => c.patient_id === patientId);
    // New patients stay NA until first check-in / score sync — no fake defaults.
    const recovery = hasCheckins || recoveryRow ? recoveryRow?.score ?? null : null;
    const risk = hasCheckins || riskRow ? riskRow?.level ?? null : null;
    const next = store.appointments
      .filter((a) => a.patient_id === patientId && a.status === "scheduled")
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];
    const unread = store.notifications.filter(
      (n) => n.user_id === patient.user_id && !n.read,
    ).length;

    return {
      patient_id: patientId,
      full_name: profile.full_name,
      greeting_name: profile.full_name.split(" ")[0] || profile.full_name,
      progress_percent: progressFromTasks(tasks),
      recovery_score: recovery,
      risk_level: risk,
      tasks,
      next_appointment: next
        ? {
            id: next.id,
            doctor_name: next.doctor_name,
            scheduled_at: next.scheduled_at,
            location: next.location,
            status: next.status,
            appointment_type: next.appointment_type,
            notes: next.notes,
            days_left: daysUntil(next.scheduled_at),
          }
        : null,
      days_until_appointment: next ? daysUntil(next.scheduled_at) : null,
      unread_notifications: unread,
    };
  },

  getCarePlanTimeline(userId: string): CarePlanTimeline[] {
    const tasks = mapTasks(resolvePatientId(userId));
    const order: TodayTask["period"][] = [
      "morning",
      "afternoon",
      "evening",
      "night",
    ];
    return order.map((period) => ({
      period,
      label: PERIOD_LABELS[period],
      tasks: tasks.filter((t) => t.period === period),
    }));
  },

  getActiveCarePlan(userId: string): ActiveCarePlanView | null {
    const patientId = resolvePatientId(userId);
    const store = getStore();
    const plan = store.carePlans.find(
      (c) => c.patient_id === patientId && c.status === "active",
    );
    if (!plan) return null;
    const discharge = plan.discharge_id
      ? store.discharges.find((d) => d.id === plan.discharge_id)
      : store.discharges
          .filter((d) => d.patient_id === patientId && d.status === "finalized")
          .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
    return {
      id: plan.id,
      version: plan.version,
      patient_summary: plan.patient_friendly_instructions,
      caregiver_instructions: plan.caregiver_instructions,
      warning_signs: plan.warning_signs || [],
      next_steps: plan.next_steps || [],
      follow_up_date: discharge?.follow_up_date ?? null,
    };
  },

  async setTaskStatus(userId: string, taskId: string, status: TaskStatus) {
    const patientId = resolvePatientId(userId);
    const date = todayKey();
    updateStore((draft) => {
      const existing = draft.taskCompletions.find(
        (c) =>
          c.patient_id === patientId && c.task_id === taskId && c.date === date,
      );
      if (existing) {
        existing.status = status;
        existing.updated_at = new Date().toISOString();
      } else {
        draft.taskCompletions.push({
          id: newId(),
          patient_id: patientId,
          task_id: taskId,
          date,
          status,
          updated_at: new Date().toISOString(),
        });
      }
    });
    await refreshScoresFromEngine(patientId);
    await syncTaskToSupabase(patientId, taskId, status);
    return this.getTodayDashboard(userId);
  },

  listMedicines(userId: string): MedicineView[] {
    const store = getStore();
    const patientId = resolvePatientId(userId);
    const date = todayKey();
    return store.medicines
      .filter((m) => m.patient_id === patientId && m.active)
      .map((m) => {
        const event = store.medicineEvents.find(
          (e) =>
            e.patient_id === patientId &&
            e.medicine_id === m.id &&
            e.date === date,
        );
        return {
          id: m.id,
          name: m.name,
          dose: m.dose,
          frequency: m.frequency,
          time_slots: m.time_slots,
          instructions: m.instructions,
          today_status:
            event?.status === "taken"
              ? "completed"
              : event?.status === "late"
                ? "late"
                : event?.status === "skipped"
                  ? "skipped"
                  : "pending",
        };
      });
  },

  async markMedicine(
    userId: string,
    medicineId: string,
    status: "taken" | "late" | "skipped",
  ) {
    const patientId = resolvePatientId(userId);
    const date = todayKey();
    updateStore((draft) => {
      const existing = draft.medicineEvents.find(
        (e) =>
          e.patient_id === patientId &&
          e.medicine_id === medicineId &&
          e.date === date,
      );
      if (existing) {
        existing.status = status;
        existing.acted_at = new Date().toISOString();
      } else {
        draft.medicineEvents.push({
          id: newId(),
          patient_id: patientId,
          medicine_id: medicineId,
          status,
          scheduled_for: null,
          acted_at: new Date().toISOString(),
          date,
        });
      }
    });
    await refreshScoresFromEngine(patientId);

    if (env.isSupabaseConfigured) {
      const supabase = getSupabaseClient();
      await supabase?.from("medicine_events").insert({
        patient_id: patientId,
        medicine_id: medicineId,
        status,
        acted_at: new Date().toISOString(),
        date,
      });
    }

    if (status === "skipped") {
      const streak = getStore()
        .medicineEvents.filter((e) => e.patient_id === patientId)
        .sort((a, b) => b.acted_at.localeCompare(a.acted_at));
      let consecutive = 0;
      for (const e of streak) {
        if (e.status === "missed" || e.status === "skipped") consecutive += 1;
        else break;
      }
      if (consecutive >= 2) {
        const { processAdherencePipeline } = await import(
          "@/modules/health-pipeline/process-checkin"
        );
        await processAdherencePipeline(patientId);
      }
    }

    return this.listMedicines(userId);
  },

  listAppointments(userId: string): AppointmentView[] {
    const patientId = resolvePatientId(userId);
    return getStore()
      .appointments.filter((a) => a.patient_id === patientId)
      .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
      .map((a) => ({
        id: a.id,
        doctor_name: a.doctor_name,
        scheduled_at: a.scheduled_at,
        location: a.location,
        status: a.status,
        appointment_type: a.appointment_type,
        notes: a.notes,
        days_left:
          a.status === "scheduled" ? daysUntil(a.scheduled_at) : null,
      }));
  },

  requestNewAppointment(
    userId: string,
    input: {
      doctorId?: string;
      scheduledAt: string;
      location?: string;
      reason?: string;
      appointmentType?: string;
    },
  ) {
    const patientId = resolvePatientId(userId);
    const store = getStore();
    const doctorId =
      input.doctorId ||
      store.relationships.find(
        (r) => r.patient_id === patientId && r.status === "active",
      )?.doctor_id;
    if (!doctorId) throw new Error("No doctor linked — ask your clinic to add you");
    const doctor = store.doctors.find((d) => d.id === doctorId);
    const doctorProfile = doctor
      ? store.profiles.find((p) => p.id === doctor.user_id)
      : null;
    const id = newId();
    const now = new Date().toISOString();
    updateStore((draft) => {
      draft.appointments.unshift({
        id,
        patient_id: patientId,
        doctor_id: doctorId,
        doctor_name: doctorProfile?.full_name || "Doctor",
        scheduled_at: new Date(input.scheduledAt).toISOString(),
        location: input.location?.trim() || "Clinic OPD",
        status: "scheduled",
        appointment_type: input.appointmentType || "follow_up",
        notes: input.reason?.trim() || "Requested by patient",
      });
      draft.notifications.unshift({
        id: newId(),
        user_id: userId,
        type: "appointment",
        title: "Appointment requested",
        body: `Scheduled ${new Date(input.scheduledAt).toLocaleString()} with ${doctorProfile?.full_name || "your doctor"}`,
        read: false,
        created_at: now,
      });
      if (doctor) {
        draft.notifications.unshift({
          id: newId(),
          user_id: doctor.user_id,
          type: "appointment",
          title: "New appointment request",
          body: `${store.profiles.find((p) => p.id === userId)?.full_name || "Patient"} requested a visit`,
          read: false,
          created_at: now,
        });
      }
    });
    return this.listAppointments(userId);
  },

  async requestAppointmentAction(
    userId: string,
    appointmentId: string,
    action: "reschedule" | "cancel",
  ) {
    const patientId = resolvePatientId(userId);
    updateStore((draft) => {
      const appt = draft.appointments.find(
        (a) => a.id === appointmentId && a.patient_id === patientId,
      );
      if (!appt) throw new Error("Appointment not found");
      appt.status =
        action === "reschedule" ? "reschedule_requested" : "cancel_requested";
      draft.notifications.unshift({
        id: newId(),
        user_id: userId,
        type: "appointment",
        title:
          action === "reschedule"
            ? "Reschedule requested"
            : "Cancellation requested",
        body: "Your care team will confirm shortly.",
        read: false,
        created_at: new Date().toISOString(),
      });
    });
    if (env.isSupabaseConfigured) {
      const supabase = getSupabaseClient();
      await supabase
        ?.from("appointments")
        .update({
          status:
            action === "reschedule"
              ? "reschedule_requested"
              : "cancel_requested",
        })
        .eq("id", appointmentId);
    }
    return this.listAppointments(userId);
  },

  getPassport(userId: string): PassportView {
    const store = getStore();
    const patientId = resolvePatientId(userId);
    const patient = store.patients.find((p) => p.id === patientId)!;
    const passport = store.passports.find((p) => p.patient_id === patientId);
    const meds = store.medicines
      .filter((m) => m.patient_id === patientId && m.active)
      .map((m) => ({
        name: m.name,
        dose: m.dose ?? undefined,
        time: m.time_slots.join(", "),
      }));
    return {
      blood_group: passport?.blood_group ?? patient.blood_group,
      allergies: passport?.allergies ?? patient.allergies,
      current_medicines: passport?.current_medicines?.length
        ? passport.current_medicines
        : meds,
      qr_token: passport?.qr_token ?? "HNDEMOQR",
      abha_id_demo: passport?.abha_id_demo ?? patient.abha_id_demo,
      emergency_contact:
        passport?.emergency_contacts ?? patient.emergency_contact,
      medical_history: passport?.medical_history ?? patient.medical_history,
    };
  },

  listNotifications(userId: string): NotificationView[] {
    return getStore()
      .notifications.filter((n) => n.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async markNotificationRead(userId: string, id: string) {
    updateStore((draft) => {
      const row = draft.notifications.find(
        (n) => n.id === id && n.user_id === userId,
      );
      if (row) row.read = true;
    });
    if (env.isSupabaseConfigured) {
      await getSupabaseClient()
        ?.from("notifications")
        .update({ read: true })
        .eq("id", id);
    }
    return this.listNotifications(userId);
  },

  async markAllNotificationsRead(userId: string) {
    updateStore((draft) => {
      draft.notifications
        .filter((n) => n.user_id === userId)
        .forEach((n) => {
          n.read = true;
        });
    });
    return this.listNotifications(userId);
  },

  getProfile(userId: string): PatientProfileView {
    const store = getStore();
    const patientId = resolvePatientId(userId);
    const patient = store.patients.find((p) => p.id === patientId)!;
    const profile = store.profiles.find((p) => p.id === patient.user_id)!;
    const passport = store.passports.find((p) => p.patient_id === patientId);
    return {
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      username: profile.username,
      passport_qr: passport?.qr_token ?? null,
      address: profile.address ?? patient.address,
      preferred_language: patient.preferred_language,
      emergency_contact: patient.emergency_contact,
      blood_group: patient.blood_group,
      allergies: patient.allergies,
      chronic_diseases: patient.chronic_diseases,
      medical_history: patient.medical_history,
      notification_prefs: profile.notification_prefs,
    };
  },

  async updateProfile(
    userId: string,
    patch: Partial<{
      username: string;
      phone: string;
      address: Record<string, unknown>;
      preferred_language: string;
      emergency_contact: PatientProfileView["emergency_contact"];
      notification_prefs: PatientProfileView["notification_prefs"];
    }>,
  ) {
    const patientId = resolvePatientId(userId);
    updateStore((draft) => {
      const profile = draft.profiles.find((p) => p.id === userId);
      const patient = draft.patients.find((p) => p.id === patientId);
      if (profile) {
        if (patch.username != null) {
          const next = patch.username.trim().toLowerCase();
          const taken = draft.profiles.some(
            (p) =>
              p.id !== profile.id &&
              p.username?.toLowerCase() === next,
          );
          if (taken) throw new Error("Username already taken");
          profile.username = next;
        }
        if (patch.phone != null) profile.phone = patch.phone;
        if (patch.address) profile.address = patch.address;
        if (patch.notification_prefs)
          profile.notification_prefs = patch.notification_prefs;
      }
      if (patient) {
        if (patch.preferred_language)
          patient.preferred_language = patch.preferred_language;
        if (patch.emergency_contact)
          patient.emergency_contact = patch.emergency_contact;
        if (patch.address) patient.address = patch.address;
        if (patch.phone != null && profile) profile.phone = patch.phone;
      }
    });

    if (env.isSupabaseConfigured) {
      const supabase = getSupabaseClient();
      if (patch.phone != null || patch.address || patch.notification_prefs) {
        await supabase
          ?.from("profiles")
          .update({
            phone: patch.phone,
            address: patch.address,
            notification_prefs: patch.notification_prefs,
          })
          .eq("id", userId);
      }
      if (patch.preferred_language || patch.emergency_contact) {
        await supabase
          ?.from("patients")
          .update({
            preferred_language: patch.preferred_language,
            emergency_contact: patch.emergency_contact,
          })
          .eq("id", patientId);
      }
    }
    return this.getProfile(userId);
  },

  async submitCheckIn(userId: string, input: CheckInInput) {
    const patientId = resolvePatientId(userId);
    const row = {
      id: newId(),
      patient_id: patientId,
      recorded_at: new Date().toISOString(),
      bp_systolic: input.bp_systolic ?? null,
      bp_diastolic: input.bp_diastolic ?? null,
      blood_sugar: input.blood_sugar ?? null,
      temperature: input.temperature ?? null,
      weight: input.weight ?? null,
      oxygen: input.oxygen ?? null,
      symptoms: input.symptoms ?? [],
      pain_score: input.pain_score ?? null,
      mood: input.mood ?? null,
      sleep_hours: input.sleep_hours ?? null,
      water_intake: input.water_intake ?? null,
      exercise: input.exercise ?? null,
      medicine_taken: input.medicine_taken ?? null,
      notes: input.notes ?? null,
    };
    updateStore((draft) => {
      draft.checkins.unshift(row);
    });

    if (env.isSupabaseConfigured) {
      await getSupabaseClient()?.from("health_checkins").insert(row);
    }

    // Health intelligence → scores → escalation → doctor/caregiver notifications
    const { processCheckInPipeline } = await import(
      "@/modules/health-pipeline/process-checkin"
    );
    const pipeline = await processCheckInPipeline(patientId, row.id);

    return { ...row, pipeline };
  },

  getRecovery(userId: string): RecoveryView {
    const dash = this.getTodayDashboard(userId);
    const meds = this.listMedicines(userId);
    const taken = meds.filter((m) => m.today_status === "completed").length;
    const adherence = meds.length
      ? Math.round((taken / meds.length) * 100)
      : 0;
    const checkins = getStore().checkins.filter(
      (c) => c.patient_id === dash.patient_id,
    ).length;
    return {
      score: dash.recovery_score,
      risk_level: dash.risk_level,
      factors: {
        medicine_adherence: adherence,
        daily_checkins: Math.min(100, checkins * 20),
        task_completion: dash.progress_percent,
        sleep: 70,
      },
    };
  },

  ensureDemoTasks(): CareTaskRow[] {
    return getStore().careTasks;
  },
};

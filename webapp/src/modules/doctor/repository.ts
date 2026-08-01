import {
  getStore,
  IDS,
  newId,
  todayKey,
  updateStore,
} from "@/data/store";
import {
  buildFollowupTimeline,
  scheduleToTaskRows,
  timeSlotsFromFrequency,
  toDailySchedule,
} from "@/modules/doctor/care-companion-integration";
import type {
  AppointmentItem,
  CarePlan,
  CheckInItem,
  DashboardStats,
  DischargeSummary,
  HighRiskPatient,
  MedicineItem,
  PatientDetail,
  PatientListItem,
} from "@/modules/doctor/types";
import { investigationRepository } from "@/modules/investigations/repository";
import { patientCaregiverService } from "@/modules/patient/caregiver-arrangements";
import { organizeCareCompanion } from "@/services/ai.service";
import { getSupabaseClient } from "@/lib/supabase";
import { normalizeUsername, suggestUsername } from "@/lib/username";

function adherenceForPatient(patientId: string): number {
  const store = getStore();
  const meds = store.medicines.filter(
    (m) => m.patient_id === patientId && m.active,
  );
  if (!meds.length) return 100;
  const today = todayKey();
  const events = store.medicineEvents.filter(
    (e) => e.patient_id === patientId && e.date === today,
  );
  let total = 0;
  let taken = 0;
  for (const med of meds) {
    const slots = med.time_slots.length || 1;
    total += slots;
    taken += events.filter(
      (e) => e.medicine_id === med.id && e.status === "taken",
    ).length;
  }
  return total ? Math.round((taken / total) * 100) : 100;
}

function missedCheckinsForPatient(patientId: string): number {
  const today = todayKey();
  const recent = getStore()
    .checkins.filter((c) => c.patient_id === patientId)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  if (!recent.length) return 3;
  const last = recent[0]!.recorded_at.slice(0, 10);
  const ms =
    new Date(`${today}T12:00:00`).getTime() -
    new Date(`${last}T12:00:00`).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function ageFromDob(dob?: string | null): number | null {
  if (!dob) return null;
  const born = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

function ensureDoctor(userId: string) {
  const store = getStore();
  const doctor =
    store.doctors.find((d) => d.user_id === userId) ||
    store.doctors.find((d) => d.id === IDS.doctor);
  if (!doctor) throw Object.assign(new Error("Doctor profile not found"), { status: 404 });
  return doctor;
}

function patientIdsFor(doctorId: string): string[] {
  return getStore()
    .relationships.filter((r) => r.doctor_id === doctorId && r.status === "active")
    .map((r) => r.patient_id);
}

function toListItem(patientId: string): PatientListItem {
  const store = getStore();
  const patient = store.patients.find((p) => p.id === patientId)!;
  const profile = store.profiles.find((p) => p.id === patient.user_id);
  return {
    id: patient.id,
    user_id: patient.user_id,
    full_name: profile?.full_name ?? "Patient",
    email: profile?.email,
    phone: profile?.phone,
    age: ageFromDob(patient.date_of_birth),
    sex: patient.sex,
    blood_group: patient.blood_group,
    status: patient.status,
    is_archived: patient.is_archived,
    recovery_score:
      store.recoveryScores.find((r) => r.patient_id === patient.id)?.score ?? null,
    risk_level: store.risks.find((r) => r.patient_id === patient.id)?.level ?? null,
    abha_id_demo: patient.abha_id_demo,
    chronic_diseases: patient.chronic_diseases,
    created_at: patient.created_at,
  };
}

export const doctorRepository = {
  dashboard(userId: string): DashboardStats {
    const doctor = ensureDoctor(userId);
    const ids = patientIdsFor(doctor.id);
    const store = getStore();
    const today = todayKey();
    const patients = store.patients.filter((p) => ids.includes(p.id) && !p.is_archived);
    const high = store.risks.filter(
      (r) => ids.includes(r.patient_id) && (r.level === "high" || r.level === "critical"),
    ).length;
    const appts = store.appointments.filter(
      (a) =>
        a.doctor_id === doctor.id &&
        a.status === "scheduled" &&
        a.scheduled_at.slice(0, 10) === today,
    );
    const events = store.medicineEvents.filter((e) => ids.includes(e.patient_id));
    const taken = events.filter((e) => e.status === "taken").length;
    const adherence = events.length ? Math.round((taken / events.length) * 100) : 60;

    return {
      total_patients: patients.length,
      active_patients: patients.filter((p) => p.status === "active").length,
      high_risk_patients: high,
      followups_due_today: appts.length,
      missed_followups: store.appointments.filter(
        (a) => a.doctor_id === doctor.id && a.status === "missed",
      ).length,
      todays_appointments: appts.length,
      medicine_adherence_percent: adherence,
      recent_alerts: store.alerts
        .filter((a) => ids.includes(a.patient_id))
        .slice(0, 5)
        .map((a) => ({
          ...a,
          patient_name: toListItem(a.patient_id).full_name,
        })),
    };
  },

  listPatients(
    userId: string,
    opts?: { search?: string; status?: string; include_archived?: boolean },
  ): PatientListItem[] {
    const doctor = ensureDoctor(userId);
    let ids = patientIdsFor(doctor.id);
    let rows = ids.map(toListItem);
    if (!opts?.include_archived) rows = rows.filter((p) => !p.is_archived);
    if (opts?.status) rows = rows.filter((p) => p.status === opts.status);
    if (opts?.search?.trim()) {
      const q = opts.search.trim().toLowerCase();
      rows = rows.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q),
      );
    }
    return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  getPatient(userId: string, patientId: string): PatientDetail {
    ensureDoctor(userId);
    const store = getStore();
    const base = toListItem(patientId);
    const patient = store.patients.find((p) => p.id === patientId);
    if (!patient) throw Object.assign(new Error("Patient not found"), { status: 404 });
    const risk = base.risk_level;
    return {
      ...base,
      date_of_birth: patient.date_of_birth,
      address: patient.address,
      allergies: patient.allergies,
      medical_history: patient.medical_history,
      emergency_contact: patient.emergency_contact,
      caregiver_info: patient.caregiver_info,
      passport: (store.passports.find((p) => p.patient_id === patientId) ??
        null) as Record<string, unknown> | null,
      ai_summary:
        store.carePlans.find(
          (c) => c.patient_id === patientId && c.status === "active",
        )?.ai_summary ??
        store.carePlans.find((c) => c.patient_id === patientId)?.ai_summary ??
        null,
      disease_progression:
        risk === "high" || risk === "critical"
          ? "worsening"
          : risk === "moderate"
            ? "watch"
            : "stable",
      adherence_percent: adherenceForPatient(patientId),
      missed_checkins: missedCheckinsForPatient(patientId),
      missed_medicines: store.medicineEvents.filter(
        (e) =>
          e.patient_id === patientId &&
          (e.status === "missed" || e.status === "skipped"),
      ).length,
    };
  },

  /**
   * Link an existing portal user to this doctor by HealNexus username
   * or digital passport QR token. Scalable for any role that owns a profile.
   */
  linkPatientByUsernameOrQr(
    userId: string,
    usernameOrQr: string,
  ): PatientDetail {
    const doctor = ensureDoctor(userId);
    const raw = usernameOrQr.trim();
    if (!raw) {
      throw Object.assign(new Error("Username or passport QR is required"), {
        status: 400,
      });
    }

    const store = getStore();
    const needle = normalizeUsername(raw);
    const qrNeedle = raw.toUpperCase();

    const profile =
      store.profiles.find(
        (p) => p.username && normalizeUsername(p.username) === needle,
      ) ||
      store.profiles.find(
        (p) =>
          p.email &&
          normalizeUsername(p.email.split("@")[0] || "") === needle,
      );

    let patient =
      profile && profile.role === "patient"
        ? store.patients.find((p) => p.user_id === profile.id)
        : undefined;

    if (!patient) {
      const passport = store.passports.find(
        (p) => p.qr_token.toUpperCase() === qrNeedle,
      );
      if (passport) {
        patient = store.patients.find((p) => p.id === passport.patient_id);
      }
    }

    if (!patient) {
      throw Object.assign(
        new Error(
          "No patient found for that username or passport QR. Ask them to share their HealNexus username or passport QR from the portal.",
        ),
        { status: 404 },
      );
    }

    updateStore((draft) => {
      const target = draft.patients.find((p) => p.id === patient!.id);
      if (target) {
        target.is_archived = false;
        target.status = "active";
      }
      const rel = draft.relationships.find(
        (r) => r.doctor_id === doctor.id && r.patient_id === patient!.id,
      );
      if (rel) {
        rel.status = "active";
      } else {
        draft.relationships.push({
          doctor_id: doctor.id,
          patient_id: patient!.id,
          status: "active",
        });
      }
      // Ensure passport exists so QR linking works next time
      if (!draft.passports.some((p) => p.patient_id === patient!.id)) {
        draft.passports.push({
          patient_id: patient!.id,
          qr_token: `HN${patient!.id.replace(/-/g, "").slice(-10).toUpperCase()}`,
          abha_id_demo: patient!.abha_id_demo,
          allergies: patient!.allergies || [],
          medical_history: patient!.medical_history,
          emergency_contacts: patient!.emergency_contact || {},
          current_medicines: [],
          blood_group: patient!.blood_group,
        });
      }
    });

    return this.getPatient(userId, patient.id);
  },

  createPatient(userId: string, body: Record<string, unknown>): PatientDetail {
    if (body.username_or_qr) {
      return this.linkPatientByUsernameOrQr(
        userId,
        String(body.username_or_qr),
      );
    }

    const doctor = ensureDoctor(userId);
    const profileId = newId();
    const patientId = newId();
    const now = new Date().toISOString();
    const allergies = String(body.allergies || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const chronic = String(body.chronic_diseases || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const username =
      (body.username as string) ||
      suggestUsername(String(body.full_name || "patient"));

    updateStore((draft) => {
      draft.profiles.push({
        id: profileId,
        email: (body.email as string) || null,
        full_name: String(body.full_name),
        phone: (body.phone as string) || null,
        role: "patient",
        locale: "en",
        username: normalizeUsername(username),
        password: (body.password as string) || "demo123",
        address: body.address_line
          ? { line1: body.address_line, city: body.city }
          : null,
        notification_prefs: {
          medicine: true,
          appointment: true,
          tips: true,
          doctor_messages: true,
        },
      });
      draft.patients.push({
        id: patientId,
        user_id: profileId,
        date_of_birth: (body.date_of_birth as string) || null,
        sex: (body.sex as string) || null,
        blood_group: (body.blood_group as string) || null,
        abha_id_demo: (body.abha_id_demo as string) || null,
        address: body.address_line
          ? { line1: String(body.address_line), city: String(body.city || "") }
          : null,
        chronic_diseases: chronic,
        allergies,
        medical_history: (body.medical_history as string) || null,
        emergency_contact: {
          name: body.emergency_name as string,
          phone: body.emergency_phone as string,
          relationship: body.emergency_relationship as string,
        },
        caregiver_info: body.caregiver_name
          ? {
              name: body.caregiver_name as string,
              phone: body.caregiver_phone as string,
              relationship: body.caregiver_relationship as string,
            }
          : null,
        preferred_language: "en",
        status: "active",
        is_archived: false,
        created_at: now,
      });
      draft.relationships.push({
        doctor_id: doctor.id,
        patient_id: patientId,
        status: "active",
      });
      draft.passports.push({
        patient_id: patientId,
        qr_token: `HN${patientId.replace(/-/g, "").slice(-10).toUpperCase()}`,
        abha_id_demo: (body.abha_id_demo as string) || null,
        allergies,
        medical_history:
          (body.medical_history as string) || chronic.join("; ") || null,
        emergency_contacts: {
          name: (body.emergency_name as string) || undefined,
          phone: (body.emergency_phone as string) || undefined,
          relationship: (body.emergency_relationship as string) || undefined,
        },
        current_medicines: [],
        blood_group: (body.blood_group as string) || null,
      });
      draft.recoveryScores.push({
        patient_id: patientId,
        score: 75,
        computed_at: now,
      });
      draft.risks.push({
        patient_id: patientId,
        score: 25,
        level: "low",
        computed_at: now,
      });
    });

    if (body.caregiver_name && body.caregiver_phone) {
      try {
        patientCaregiverService.add(profileId, {
          name: String(body.caregiver_name),
          phone: String(body.caregiver_phone),
          relationship: String(body.caregiver_relationship || "Family"),
          makePrimary: true,
        });
      } catch {
        // Caregiver invite is best-effort; patient record remains valid.
      }
    }

    return this.getPatient(userId, patientId);
  },

  updatePatient(
    userId: string,
    patientId: string,
    body: Record<string, unknown>,
  ): PatientDetail {
    ensureDoctor(userId);
    updateStore((draft) => {
      const patient = draft.patients.find((p) => p.id === patientId);
      const profile = patient
        ? draft.profiles.find((p) => p.id === patient.user_id)
        : undefined;
      if (!patient || !profile) throw new Error("Patient not found");
      if (body.full_name) profile.full_name = String(body.full_name);
      if (body.phone != null) profile.phone = String(body.phone);
      if (body.email != null) profile.email = String(body.email);
      if (body.blood_group != null) patient.blood_group = String(body.blood_group);
      if (body.medical_history != null)
        patient.medical_history = String(body.medical_history);
    });
    return this.getPatient(userId, patientId);
  },

  deletePatient(userId: string, patientId: string) {
    const doctor = ensureDoctor(userId);
    updateStore((draft) => {
      draft.relationships = draft.relationships.filter(
        (r) => !(r.doctor_id === doctor.id && r.patient_id === patientId),
      );
      const patient = draft.patients.find((p) => p.id === patientId);
      if (patient) {
        patient.is_archived = true;
        patient.status = "archived";
      }
    });
    return { ok: true };
  },

  archivePatient(userId: string, patientId: string) {
    ensureDoctor(userId);
    updateStore((draft) => {
      const patient = draft.patients.find((p) => p.id === patientId);
      if (!patient) throw new Error("Patient not found");
      patient.is_archived = true;
      patient.status = "archived";
    });
    return { message: "Patient archived", code: "PATIENT_ARCHIVED" };
  },

  highRisk(
    userId: string,
    opts?: { min_risk?: string; sort_by?: string },
  ): HighRiskPatient[] {
    const rows = this.listPatients(userId)
      .filter((p) => p.risk_level === "high" || p.risk_level === "critical" || p.risk_level === "moderate")
      .filter((p) => {
        if (!opts?.min_risk) return p.risk_level !== "low";
        const order = ["low", "moderate", "high", "critical"];
        return order.indexOf(p.risk_level || "low") >= order.indexOf(opts.min_risk);
      })
      .map((p) => ({
        patient_id: p.id,
        full_name: p.full_name,
        recovery_score: p.recovery_score ?? 0,
        readmission_risk: (p.risk_level || "moderate") as NonNullable<
          HighRiskPatient["readmission_risk"]
        >,
        disease_progression: undefined,
        missed_medicines: getStore().medicineEvents.filter(
          (e) =>
            e.patient_id === p.id &&
            (e.status === "missed" || e.status === "skipped"),
        ).length,
        missed_checkins: missedCheckinsForPatient(p.id),
        escalation_status:
          getStore().alerts.some(
            (a) => a.patient_id === p.id && a.status === "open",
          )
            ? "escalated"
            : "watch",
        phone: p.phone,
      }));
    if (opts?.sort_by === "missed_medicines") return rows;
    return rows.sort(
      (a, b) => (a.recovery_score ?? 0) - (b.recovery_score ?? 0),
    );
  },

  listDischarges(userId: string, patientId: string): DischargeSummary[] {
    ensureDoctor(userId);
    return getStore()
      .discharges.filter((d) => d.patient_id === patientId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at)) as DischargeSummary[];
  },

  upsertDischarge(
    userId: string,
    patientId: string,
    body: Record<string, unknown>,
    dischargeId?: string,
  ): DischargeSummary {
    const doctor = ensureDoctor(userId);
    let id = dischargeId;
    updateStore((draft) => {
      let row = id ? draft.discharges.find((d) => d.id === id) : undefined;
      if (!row) {
        id = newId();
        row = {
          id,
          patient_id: patientId,
          doctor_id: doctor.id,
          source: "manual",
          diagnosis_text: null,
          medicines_text: null,
          doctor_notes: null,
          diet_advice: null,
          exercise_advice: null,
          restrictions: null,
          special_instructions: null,
          follow_up_date: null,
          discharge_date: null,
          hospital_name: null,
          file_url: null,
          status: "draft",
          finalized_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        draft.discharges.push(row);
      }
      const fields = [
        "diagnosis_text",
        "medicines_text",
        "doctor_notes",
        "diet_advice",
        "exercise_advice",
        "restrictions",
        "special_instructions",
        "follow_up_date",
        "discharge_date",
        "hospital_name",
      ] as const;
      for (const f of fields) {
        if (body[f] != null) {
          (row as unknown as Record<string, unknown>)[f] = body[f];
        }
      }
      row.updated_at = new Date().toISOString();
    });
    return getStore().discharges.find((d) => d.id === id)! as DischargeSummary;
  },

  async finalizeDischarge(userId: string, dischargeId: string): Promise<CarePlan> {
    const doctor = ensureDoctor(userId);
    const store = getStore();
    const discharge = store.discharges.find((d) => d.id === dischargeId);
    if (!discharge) throw new Error("Discharge not found");

    const patient = store.patients.find((p) => p.id === discharge.patient_id);
    const profile = store.profiles.find((p) => p.id === patient?.user_id);
    const planId = newId();
    const now = new Date().toISOString();
    const nextVersion =
      Math.max(
        0,
        ...store.carePlans
          .filter((c) => c.patient_id === discharge.patient_id)
          .map((c) => c.version || 0),
      ) + 1;

    updateStore((draft) => {
      const d = draft.discharges.find((x) => x.id === dischargeId)!;
      d.status = "finalized";
      d.finalized_at = now;
      d.updated_at = now;

      for (const plan of draft.carePlans) {
        if (
          plan.patient_id === d.patient_id &&
          (plan.status === "ai_draft" || plan.status === "generating")
        ) {
          plan.status = "superseded";
          plan.updated_at = now;
        }
      }

      draft.carePlans.unshift({
        id: planId,
        patient_id: d.patient_id,
        doctor_id: doctor.id,
        discharge_id: d.id,
        status: "generating",
        version: nextVersion,
        caregiver_instructions: null,
        patient_friendly_instructions: null,
        ai_summary: "Generating AI recovery plan from discharge summary…",
        warning_signs: [],
        next_steps: [],
        daily_schedule: null,
        doctor_review_notes: null,
        approved_by: null,
        approved_at: null,
        created_at: now,
        updated_at: now,
      });
    });

    investigationRepository.activateForDischarge(dischargeId);

    const investigationText =
      investigationRepository.textSummaryForPatient(discharge.patient_id);

    const organized = await organizeCareCompanion({
      diagnosis: discharge.diagnosis_text || undefined,
      medicines: discharge.medicines_text || undefined,
      doctor_notes: discharge.doctor_notes || undefined,
      diet_advice: discharge.diet_advice || undefined,
      exercise_advice: discharge.exercise_advice || undefined,
      restrictions: discharge.restrictions || undefined,
      special_instructions: [
        discharge.special_instructions,
        investigationText
          ? `Required investigations:\n${investigationText}`
          : null,
      ]
        .filter(Boolean)
        .join("\n\n") || undefined,
      follow_up_date: discharge.follow_up_date || undefined,
      hospital_name: discharge.hospital_name || undefined,
      patient_name: profile?.full_name,
      investigations: investigationText || undefined,
    });

    const filledAt = new Date().toISOString();
    updateStore((draft) => {
      const plan = draft.carePlans.find((c) => c.id === planId);
      if (!plan) return;

      plan.status = "ai_draft";
      plan.caregiver_instructions = organized.caregiver_instructions;
      plan.patient_friendly_instructions =
        organized.patient_friendly_explanation;
      plan.ai_summary = organized.patient_friendly_explanation;
      plan.warning_signs = organized.warning_signs || [];
      plan.next_steps = organized.next_steps || [];
      plan.daily_schedule = toDailySchedule(organized.daily_schedule);
      plan.updated_at = filledAt;

      const meds = organized.organized_medicines?.length
        ? organized.organized_medicines
        : [];

      for (const med of meds) {
        draft.medicines.push({
          id: newId(),
          patient_id: plan.patient_id,
          care_plan_id: planId,
          name: med.name,
          dose: med.dose ?? null,
          frequency: med.frequency ?? "As directed",
          time_slots: timeSlotsFromFrequency(med.frequency),
          instructions:
            med.instructions ||
            "Take exactly as prescribed by your doctor.",
          active: false,
        });
      }

      const tasks = scheduleToTaskRows(organized.daily_schedule);
      for (const task of tasks) {
        draft.careTasks.push({
          id: newId(),
          patient_id: plan.patient_id,
          care_plan_id: planId,
          title: task.title,
          description: task.description,
          period: task.period,
          sort_order: task.sort_order,
          active: false,
        });
      }
    });

    return this.getCarePlan(userId, planId);
  },

  listCarePlans(userId: string, patientId: string): CarePlan[] {
    ensureDoctor(userId);
    return getStore()
      .carePlans.filter((c) => c.patient_id === patientId)
      .sort((a, b) => b.version - a.version || b.created_at.localeCompare(a.created_at))
      .map((c) => this.getCarePlan(userId, c.id));
  },

  getCarePlan(userId: string, carePlanId: string): CarePlan {
    ensureDoctor(userId);
    const store = getStore();
    const plan = store.carePlans.find((c) => c.id === carePlanId);
    if (!plan) throw new Error("Care plan not found");
    const meds = store.medicines.filter((m) => m.care_plan_id === carePlanId);
    const discharge = plan.discharge_id
      ? store.discharges.find((d) => d.id === plan.discharge_id) || null
      : store.discharges
          .filter((d) => d.patient_id === plan.patient_id)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] || null;

    return {
      id: plan.id,
      patient_id: plan.patient_id,
      doctor_id: plan.doctor_id,
      discharge_id: plan.discharge_id,
      status: plan.status,
      version: plan.version,
      caregiver_instructions: plan.caregiver_instructions,
      patient_friendly_instructions: plan.patient_friendly_instructions,
      warning_signs: plan.warning_signs || [],
      next_steps: plan.next_steps || [],
      daily_schedule: plan.daily_schedule,
      followup_timeline: buildFollowupTimeline(
        plan.next_steps || [],
        discharge?.follow_up_date,
      ),
      doctor_review_notes: plan.doctor_review_notes,
      ai_summary: plan.ai_summary,
      approved_by: plan.approved_by,
      approved_at: plan.approved_at,
      updated_at: plan.updated_at,
      source_discharge: discharge
        ? {
            diagnosis_text: discharge.diagnosis_text,
            medicines_text: discharge.medicines_text,
            doctor_notes: discharge.doctor_notes,
            diet_advice: discharge.diet_advice,
            exercise_advice: discharge.exercise_advice,
            restrictions: discharge.restrictions,
            special_instructions: discharge.special_instructions,
            follow_up_date: discharge.follow_up_date,
            hospital_name: discharge.hospital_name,
          }
        : null,
      medicines: meds.map((m) => ({
        id: m.id,
        care_plan_id: carePlanId,
        name: m.name,
        dose: m.dose,
        frequency: m.frequency,
        route: "oral",
        schedule: { times: m.time_slots },
        instructions: m.instructions,
      })),
      daily_tasks: store.careTasks
        .filter((t) => t.care_plan_id === carePlanId)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((t) => ({
          id: t.id,
          care_plan_id: carePlanId,
          title: t.title,
          description: t.description,
          cadence: "daily",
          priority: t.sort_order,
          active: t.active,
        })),
      disclaimer:
        "AI Care Companion assists only. It never diagnoses, never prescribes, and never replaces doctors.",
    };
  },

  updateCarePlanDraft(
    userId: string,
    carePlanId: string,
    body: Record<string, unknown>,
  ): CarePlan {
    ensureDoctor(userId);
    const now = new Date().toISOString();
    updateStore((draft) => {
      const plan = draft.carePlans.find((c) => c.id === carePlanId);
      if (!plan) throw new Error("Care plan not found");
      if (plan.status !== "ai_draft" && plan.status !== "generating") {
        throw new Error("Only AI drafts can be edited before approval");
      }
      if (typeof body.caregiver_instructions === "string") {
        plan.caregiver_instructions = body.caregiver_instructions;
      }
      if (typeof body.patient_friendly_instructions === "string") {
        plan.patient_friendly_instructions = body.patient_friendly_instructions;
        plan.ai_summary = body.patient_friendly_instructions;
      }
      if (typeof body.doctor_review_notes === "string") {
        plan.doctor_review_notes = body.doctor_review_notes;
      }
      if (Array.isArray(body.warning_signs)) {
        plan.warning_signs = body.warning_signs.map(String);
      }
      if (Array.isArray(body.next_steps)) {
        plan.next_steps = body.next_steps.map(String);
      }
      plan.updated_at = now;
    });
    return this.getCarePlan(userId, carePlanId);
  },

  rejectCarePlan(
    userId: string,
    carePlanId: string,
    body: Record<string, unknown> = {},
  ): CarePlan {
    ensureDoctor(userId);
    const now = new Date().toISOString();
    updateStore((draft) => {
      const plan = draft.carePlans.find((c) => c.id === carePlanId);
      if (!plan) throw new Error("Care plan not found");
      plan.status = "rejected";
      plan.doctor_review_notes =
        (body.doctor_review_notes as string) ||
        plan.doctor_review_notes ||
        "Rejected by doctor — AI draft not published.";
      plan.updated_at = now;
      for (const task of draft.careTasks) {
        if (task.care_plan_id === carePlanId) task.active = false;
      }
      for (const med of draft.medicines) {
        if (med.care_plan_id === carePlanId) med.active = false;
      }
    });
    return this.getCarePlan(userId, carePlanId);
  },

  async approveCarePlan(
    userId: string,
    carePlanId: string,
    body: Record<string, unknown>,
  ): Promise<CarePlan> {
    const doctor = ensureDoctor(userId);
    const now = new Date().toISOString();
    let patientUserId: string | null = null;
    let patientName = "Patient";

    updateStore((draft) => {
      const plan = draft.carePlans.find((c) => c.id === carePlanId);
      if (!plan) throw new Error("Care plan not found");
      if (plan.status === "rejected" || plan.status === "superseded") {
        throw new Error("This care plan can no longer be approved");
      }

      const patient = draft.patients.find((p) => p.id === plan.patient_id);
      const profile = draft.profiles.find((p) => p.id === patient?.user_id);
      patientUserId = patient?.user_id ?? null;
      patientName = profile?.full_name || "Patient";

      if (typeof body.caregiver_instructions === "string") {
        plan.caregiver_instructions = body.caregiver_instructions;
      }
      if (typeof body.patient_friendly_instructions === "string") {
        plan.patient_friendly_instructions = body.patient_friendly_instructions;
        plan.ai_summary = body.patient_friendly_instructions;
      }
      if (typeof body.doctor_review_notes === "string") {
        plan.doctor_review_notes = body.doctor_review_notes;
      }
      if (Array.isArray(body.warning_signs)) {
        plan.warning_signs = body.warning_signs.map(String);
      }
      if (Array.isArray(body.next_steps)) {
        plan.next_steps = body.next_steps.map(String);
      }

      for (const other of draft.carePlans) {
        if (
          other.patient_id === plan.patient_id &&
          other.id !== plan.id &&
          (other.status === "active" || other.status === "doctor_approved")
        ) {
          other.status = "superseded";
          other.updated_at = now;
        }
      }

      for (const task of draft.careTasks) {
        if (task.patient_id === plan.patient_id) {
          task.active = task.care_plan_id === plan.id;
        }
      }
      for (const med of draft.medicines) {
        if (med.patient_id === plan.patient_id) {
          med.active = med.care_plan_id === plan.id;
        }
      }

      plan.status = "active";
      plan.approved_by = doctor.user_id;
      plan.approved_at = now;
      plan.updated_at = now;

      const activeMeds = draft.medicines.filter(
        (m) => m.patient_id === plan.patient_id && m.active,
      );
      const passport = draft.passports.find(
        (p) => p.patient_id === plan.patient_id,
      );
      if (passport) {
        passport.current_medicines = activeMeds.map((m) => ({
          name: m.name,
          dose: m.dose || undefined,
          time: m.time_slots?.[0] || undefined,
        }));
      }

      if (patientUserId) {
        draft.notifications.unshift({
          id: newId(),
          user_id: patientUserId,
          type: "doctor_message",
          title: "Recovery Plan Ready",
          body: "Your recovery plan is ready. Open Today's Recovery Journey to begin.",
          read: false,
          created_at: now,
        });
      }

      const caregivers = draft.caregiverArrangements.filter(
        (a) => a.patient_id === plan.patient_id && a.status === "active",
      );
      for (const cg of caregivers) {
        draft.notifications.unshift({
          id: newId(),
          user_id: cg.caregiver_user_id,
          type: "doctor_message",
          title: "New Care Instructions",
          body: `Updated caregiver instructions for ${patientName} are ready to review.`,
          read: false,
          created_at: now,
        });
      }

      draft.notifications.unshift({
        id: newId(),
        user_id: doctor.user_id,
        type: "doctor_message",
        title: "Plan Successfully Published",
        body: `AI Care Companion plan v${plan.version} for ${patientName} is now live.`,
        read: false,
        created_at: now,
      });
    });

    await persistApprovedCarePlan(carePlanId);
    return this.getCarePlan(userId, carePlanId);
  },

  aiSummary(userId: string, patientId: string) {
    const detail = this.getPatient(userId, patientId);
    return {
      patient_id: patientId,
      summary: detail.ai_summary || "No AI summary yet.",
      assistive: true,
      disclaimer:
        "AI Care Companion assists only. It never diagnoses or replaces the doctor.",
    };
  },

  listCheckins(userId: string, patientId: string): CheckInItem[] {
    ensureDoctor(userId);
    return getStore()
      .checkins.filter((c) => c.patient_id === patientId)
      .map((c) => ({
        id: c.id,
        patient_id: patientId,
        recorded_at: c.recorded_at,
        pain_score: c.pain_score,
        symptoms: { items: c.symptoms },
        vitals: {
          bp_systolic: c.bp_systolic,
          bp_diastolic: c.bp_diastolic,
          sugar: c.blood_sugar,
          temperature: c.temperature,
          weight: c.weight,
          oxygen: c.oxygen,
        },
        notes: c.notes,
      }));
  },

  listMedicines(userId: string, patientId: string): MedicineItem[] {
    ensureDoctor(userId);
    return getStore()
      .medicines.filter((m) => m.patient_id === patientId)
      .map((m) => ({
        id: m.id,
        care_plan_id: m.care_plan_id || "",
        name: m.name,
        dose: m.dose,
        frequency: m.frequency,
        route: "oral",
        schedule: { times: m.time_slots },
        instructions: m.instructions,
      }));
  },

  listAppointments(userId: string): AppointmentItem[] {
    const doctor = ensureDoctor(userId);
    return getStore()
      .appointments.filter((a) => a.doctor_id === doctor.id)
      .map((a) => ({
        id: a.id,
        patient_id: a.patient_id,
        doctor_id: a.doctor_id,
        patient_name: toListItem(a.patient_id).full_name,
        scheduled_at: a.scheduled_at,
        location: a.location,
        status: ([
          "scheduled",
          "approved",
          "completed",
          "cancelled",
          "missed",
        ].includes(a.status)
          ? a.status
          : "scheduled") as AppointmentItem["status"],
        appointment_type: a.appointment_type,
        notes: a.notes,
      }));
  },

  createAppointment(userId: string, body: Record<string, unknown>): AppointmentItem {
    const doctor = ensureDoctor(userId);
    const id = newId();
    const doctorName =
      getStore().profiles.find((p) => p.id === userId)?.full_name ||
      "Dr. Ananya Mehta";
    updateStore((draft) => {
      draft.appointments.push({
        id,
        patient_id: String(body.patient_id),
        doctor_id: doctor.id,
        doctor_name: doctorName,
        scheduled_at: String(body.scheduled_at),
        location: (body.location as string) || null,
        status: "scheduled",
        appointment_type: (body.appointment_type as string) || "follow_up",
        notes: (body.notes as string) || null,
      });
    });
    return this.listAppointments(userId).find((a) => a.id === id)!;
  },

  updateAppointment(
    userId: string,
    id: string,
    body: Record<string, unknown>,
  ): AppointmentItem {
    ensureDoctor(userId);
    updateStore((draft) => {
      const row = draft.appointments.find((a) => a.id === id);
      if (!row) throw new Error("Appointment not found");
      if (body.scheduled_at) row.scheduled_at = String(body.scheduled_at);
      if (body.location != null) row.location = String(body.location);
      if (body.status) row.status = body.status as typeof row.status;
      if (body.notes != null) row.notes = String(body.notes);
    });
    return this.listAppointments(userId).find((a) => a.id === id)!;
  },

  cancelAppointment(userId: string, id: string): AppointmentItem {
    return this.updateAppointment(userId, id, { status: "cancelled" });
  },
};

async function persistApprovedCarePlan(carePlanId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const plan = getStore().carePlans.find((c) => c.id === carePlanId);
  if (!plan) return;
  try {
    await supabase.from("care_plans").upsert({
      id: plan.id,
      patient_id: plan.patient_id,
      doctor_id: plan.doctor_id,
      discharge_id: plan.discharge_id,
      status: plan.status,
      version: plan.version,
      caregiver_instructions: plan.caregiver_instructions,
      patient_friendly_instructions: plan.patient_friendly_instructions,
      ai_summary: plan.ai_summary,
      warning_signs: plan.warning_signs,
      next_steps: plan.next_steps,
      daily_schedule: plan.daily_schedule,
      doctor_review_notes: plan.doctor_review_notes,
      approved_by: plan.approved_by,
      approved_at: plan.approved_at,
      updated_at: plan.updated_at,
      created_at: plan.created_at,
    });
  } catch {
    // Demo store remains source of truth when remote schema is unavailable.
  }
}

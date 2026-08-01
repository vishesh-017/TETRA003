import {
  getStore,
  IDS,
  newId,
  todayKey,
  updateStore,
} from "@/data/store";
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
        store.carePlans.find((c) => c.patient_id === patientId)?.ai_summary ?? null,
      disease_progression:
        risk === "high" || risk === "critical"
          ? "worsening"
          : risk === "moderate"
            ? "watch"
            : "stable",
      adherence_percent: 70,
      missed_checkins: 0,
      missed_medicines: store.medicineEvents.filter(
        (e) => e.patient_id === patientId && e.status === "missed",
      ).length,
    };
  },

  createPatient(userId: string, body: Record<string, unknown>): PatientDetail {
    const doctor = ensureDoctor(userId);
    const profileId = newId();
    const patientId = newId();
    updateStore((draft) => {
      draft.profiles.push({
        id: profileId,
        email: (body.email as string) || null,
        full_name: String(body.full_name),
        phone: (body.phone as string) || null,
        role: "patient",
        locale: "en",
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
        chronic_diseases: String(body.chronic_diseases || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        allergies: String(body.allergies || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
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
        created_at: new Date().toISOString(),
      });
      draft.relationships.push({
        doctor_id: doctor.id,
        patient_id: patientId,
        status: "active",
      });
      draft.recoveryScores.push({
        patient_id: patientId,
        score: 75,
        computed_at: new Date().toISOString(),
      });
      draft.risks.push({
        patient_id: patientId,
        score: 25,
        level: "low",
        computed_at: new Date().toISOString(),
      });
    });
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
        missed_medicines: 0,
        missed_checkins: 0,
        escalation_status: "watch",
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

  finalizeDischarge(userId: string, dischargeId: string): CarePlan {
    const doctor = ensureDoctor(userId);
    const store = getStore();
    const discharge = store.discharges.find((d) => d.id === dischargeId);
    if (!discharge) throw new Error("Discharge not found");
    const planId = newId();
    updateStore((draft) => {
      const d = draft.discharges.find((x) => x.id === dischargeId)!;
      d.status = "finalized";
      d.finalized_at = new Date().toISOString();
      draft.carePlans.unshift({
        id: planId,
        patient_id: d.patient_id,
        doctor_id: doctor.id,
        status: "ai_draft",
        caregiver_instructions: "Support medicine adherence and daily check-ins.",
        patient_friendly_instructions:
          "Follow medicines, walk daily, hydrate, and log vitals.",
        ai_summary: `Organized plan for: ${d.diagnosis_text || "recovery"}. Medicines: ${d.medicines_text || "as prescribed"}.`,
        approved_at: null,
        created_at: new Date().toISOString(),
      });
      if (d.medicines_text) {
        draft.medicines.push({
          id: newId(),
          patient_id: d.patient_id,
          care_plan_id: planId,
          name: d.medicines_text.split("\n")[0] || "Prescribed medicine",
          dose: null,
          frequency: "As directed",
          time_slots: ["08:00", "20:00"],
          instructions: "Take exactly as prescribed by your doctor.",
          active: true,
        });
      }
    });
    return this.getCarePlan(userId, planId);
  },

  listCarePlans(userId: string, patientId: string): CarePlan[] {
    ensureDoctor(userId);
    return getStore()
      .carePlans.filter((c) => c.patient_id === patientId)
      .map((c) => this.getCarePlan(userId, c.id));
  },

  getCarePlan(userId: string, carePlanId: string): CarePlan {
    ensureDoctor(userId);
    const plan = getStore().carePlans.find((c) => c.id === carePlanId);
    if (!plan) throw new Error("Care plan not found");
    const meds = getStore().medicines.filter((m) => m.care_plan_id === carePlanId);
    return {
      id: plan.id,
      patient_id: plan.patient_id,
      doctor_id: plan.doctor_id,
      discharge_id: null,
      status: plan.status,
      caregiver_instructions: plan.caregiver_instructions,
      patient_friendly_instructions: plan.patient_friendly_instructions,
      followup_timeline: [],
      doctor_review_notes: null,
      ai_summary: plan.ai_summary,
      approved_at: plan.approved_at,
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
      daily_tasks: getStore()
        .careTasks.filter((t) => t.care_plan_id === carePlanId)
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

  approveCarePlan(
    userId: string,
    carePlanId: string,
    _body: Record<string, unknown>,
  ): CarePlan {
    ensureDoctor(userId);
    updateStore((draft) => {
      const plan = draft.carePlans.find((c) => c.id === carePlanId);
      if (!plan) throw new Error("Care plan not found");
      plan.status = "active";
      plan.approved_at = new Date().toISOString();
    });
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
        status: (["scheduled", "completed", "cancelled", "missed"].includes(
          a.status,
        )
          ? a.status
          : "scheduled") as AppointmentItem["status"],
        appointment_type: a.appointment_type,
        notes: a.notes,
      }));
  },

  createAppointment(userId: string, body: Record<string, unknown>): AppointmentItem {
    const doctor = ensureDoctor(userId);
    const id = newId();
    updateStore((draft) => {
      draft.appointments.push({
        id,
        patient_id: String(body.patient_id),
        doctor_id: doctor.id,
        doctor_name: "Dr. Demo Clinician",
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

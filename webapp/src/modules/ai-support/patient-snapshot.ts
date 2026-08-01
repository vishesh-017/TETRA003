import { getStore } from "@/data/store";
import { evaluateHealth } from "@/lib/health-engine";
import { getLifestyleHabits } from "@/modules/patient/lifestyle-habits";
import { patientRepository } from "@/modules/patient/repository";
import { buildObservationsFromLocal } from "@/modules/prediction/adapters";
import { normalizeConditions } from "@/modules/ai-support/screening-knowledge";

export interface LivePatientSnapshot {
  patient_id: string;
  user_id: string;
  full_name: string;
  age: number | null;
  sex: string | null;
  blood_group: string | null;
  chronic_diseases: string[];
  conditions: ReturnType<typeof normalizeConditions>;
  allergies: string[];
  medical_history: string | null;
  diagnosis: string;
  medicines: Array<{
    name: string;
    dose: string | null;
    frequency: string | null;
    time_slots: string[];
    active: boolean;
  }>;
  investigations: Array<{
    name: string;
    status: string;
    due_date: string;
    priority: string;
  }>;
  clinical_reports: Array<{
    title: string;
    report_type: string;
    status: string;
    doctor_feedback: string | null;
  }>;
  latest_checkin: {
    recorded_at: string;
    bp_systolic: number | null;
    bp_diastolic: number | null;
    blood_sugar: number | null;
    weight: number | null;
    oxygen: number | null;
    sleep_hours: number | null;
    symptoms: string[];
    pain_score: number | null;
    notes: string | null;
  } | null;
  checkin_count: number;
  open_alerts: Array<{ title: string; severity: string; reason: string }>;
  lifestyle: ReturnType<typeof getLifestyleHabits>;
  recovery_score: number;
  risk_level: string;
  readmission_probability_percent: number;
  health: ReturnType<typeof evaluateHealth>;
  care_plan_warning_signs: string[];
  care_plan_summary: string | null;
}

function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

/** Build a fully live clinical snapshot — no fabricated vitals. */
export function buildLivePatientSnapshot(
  userOrPatientId: string,
): LivePatientSnapshot | null {
  const store = getStore();
  const byPatient = store.patients.find((p) => p.id === userOrPatientId);
  const byUser = store.patients.find((p) => p.user_id === userOrPatientId);
  const patient = byPatient || byUser;
  if (!patient) return null;

  const profile = store.profiles.find((p) => p.id === patient.user_id);
  const discharge = store.discharges
    .filter((d) => d.patient_id === patient.id)
    .sort((a, b) =>
      (b.discharge_date || b.created_at).localeCompare(
        a.discharge_date || a.created_at,
      ),
    )[0];

  const chronic = [...(patient.chronic_diseases || [])];
  if (discharge?.diagnosis_text) {
    for (const part of discharge.diagnosis_text.split(/[,;]/)) {
      const t = part.trim();
      if (t && !chronic.some((c) => c.toLowerCase() === t.toLowerCase())) {
        chronic.push(t);
      }
    }
  }

  const checkins = store.checkins
    .filter((c) => c.patient_id === patient.id)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  const latest = checkins[0] || null;

  const medicines = store.medicines
    .filter((m) => m.patient_id === patient.id && m.active)
    .map((m) => ({
      name: m.name,
      dose: m.dose,
      frequency: m.frequency,
      time_slots: m.time_slots,
      active: m.active,
    }));

  const investigations = store.investigations
    .filter((i) => i.patient_id === patient.id)
    .map((i) => ({
      name: i.name,
      status: i.status,
      due_date: i.due_date,
      priority: i.priority,
    }));

  const clinical_reports = store.clinicalReports
    .filter((r) => r.patient_id === patient.id)
    .map((r) => ({
      title: r.title,
      report_type: r.report_type,
      status: r.status,
      doctor_feedback: r.doctor_feedback,
    }));

  const open_alerts = store.alerts
    .filter((a) => a.patient_id === patient.id && a.status === "open")
    .map((a) => ({
      title: a.title,
      severity: a.severity,
      reason: a.reason || a.body,
    }));

  const carePlan = store.carePlans
    .filter(
      (c) =>
        c.patient_id === patient.id &&
        (c.status === "active" || c.status === "doctor_approved"),
    )
    .sort((a, b) => b.version - a.version)[0];

  const obs = buildObservationsFromLocal(patient.id);
  const health = evaluateHealth(obs);
  const recoveryRow = store.recoveryScores.find(
    (r) => r.patient_id === patient.id,
  );
  const riskRow = store.risks.find((r) => r.patient_id === patient.id);

  return {
    patient_id: patient.id,
    user_id: patient.user_id,
    full_name: profile?.full_name || "Patient",
    age: ageFromDob(patient.date_of_birth),
    sex: patient.sex,
    blood_group: patient.blood_group,
    chronic_diseases: chronic,
    conditions: normalizeConditions(chronic),
    allergies: patient.allergies || [],
    medical_history: patient.medical_history,
    diagnosis:
      discharge?.diagnosis_text ||
      chronic.join(", ") ||
      "Post-discharge monitoring",
    medicines,
    investigations,
    clinical_reports,
    latest_checkin: latest
      ? {
          recorded_at: latest.recorded_at,
          bp_systolic: latest.bp_systolic,
          bp_diastolic: latest.bp_diastolic,
          blood_sugar: latest.blood_sugar,
          weight: latest.weight,
          oxygen: latest.oxygen,
          sleep_hours: latest.sleep_hours,
          symptoms: latest.symptoms || [],
          pain_score: latest.pain_score,
          notes: latest.notes,
        }
      : null,
    checkin_count: checkins.length,
    open_alerts,
    lifestyle: getLifestyleHabits(patient.id),
    recovery_score: Math.round(
      recoveryRow?.score ?? health.recovery.recovery_score,
    ),
    risk_level: riskRow?.level || health.readmission.risk_category,
    readmission_probability_percent: Math.round(
      health.readmission.readmission_probability_percent,
    ),
    health,
    care_plan_warning_signs: carePlan?.warning_signs || [],
    care_plan_summary: carePlan?.ai_summary || null,
  };
}

export function serializeSnapshotForAi(snap: LivePatientSnapshot): string {
  return JSON.stringify(
    {
      name: snap.full_name,
      age: snap.age,
      sex: snap.sex,
      diagnosis: snap.diagnosis,
      conditions: snap.chronic_diseases,
      allergies: snap.allergies,
      medical_history: snap.medical_history,
      medicines: snap.medicines,
      latest_vitals: snap.latest_checkin,
      investigations: snap.investigations,
      reports: snap.clinical_reports.map((r) => r.title),
      open_alerts: snap.open_alerts,
      recovery_score: snap.recovery_score,
      risk_level: snap.risk_level,
      readmission_probability_percent: snap.readmission_probability_percent,
      lifestyle: snap.lifestyle,
      care_plan_summary: snap.care_plan_summary,
      warning_signs: snap.care_plan_warning_signs,
    },
    null,
    2,
  );
}

export function resolvePatientIdForUser(userId: string): string | null {
  return patientRepository.resolvePatientId(userId);
}

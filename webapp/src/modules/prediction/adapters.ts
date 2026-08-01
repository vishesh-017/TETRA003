import { getStore, IDS } from "@/data/store";
import { patientRepository } from "@/modules/patient/repository";
import type { PatientObservationBundle, TimedValue } from "@/modules/prediction/types";

function seriesFrom(
  values: Array<number | null | undefined>,
  dates?: string[],
): TimedValue[] {
  return values
    .map((v, i) =>
      v == null
        ? null
        : {
            value: v,
            recorded_at: dates?.[i] ?? null,
          },
    )
    .filter(Boolean) as TimedValue[];
}

/** Resolve store patient id from auth user id or patient row id. */
function resolvePatientRecord(userOrPatientId: string) {
  const store = getStore();
  const byPatient = store.patients.find((p) => p.id === userOrPatientId);
  if (byPatient) return byPatient;
  return store.patients.find((p) => p.user_id === userOrPatientId) ?? null;
}

/** Build observation payload from the dynamic local store (patient or user id). */
export function buildObservationsFromLocal(
  userOrPatientId: string,
): PatientObservationBundle {
  const store = getStore();
  const patient = resolvePatientRecord(userOrPatientId);
  const patientId = patient?.id || patientRepository.resolvePatientId(userOrPatientId);
  const userId = patient?.user_id || userOrPatientId;
  const profile = store.profiles.find((p) => p.id === patient?.user_id);
  const recovery = patientRepository.getRecovery(userId);
  const meds = patientRepository.listMedicines(userId);
  const taken = meds.filter((m) => m.today_status === "completed").length;
  const adherence = meds.length ? (taken / meds.length) * 100 : 72;
  const missedMeds = store.medicineEvents.filter(
    (e) => e.patient_id === patientId && e.status === "missed",
  ).length;

  const checkins = store.checkins
    .filter((c) => c.patient_id === patientId)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));

  // Seed a clinically meaningful demo series when check-ins are sparse
  const sugarDemo = [132, 140, 148, 155, 168];
  const bpDemo = [128, 132, 136, 142, 148];
  const sugar =
    checkins.length >= 2
      ? seriesFrom(
          checkins.map((c) => c.blood_sugar),
          checkins.map((c) => c.recorded_at),
        )
      : seriesFrom(sugarDemo);
  const bpSys =
    checkins.length >= 2
      ? seriesFrom(
          checkins.map((c) => c.bp_systolic),
          checkins.map((c) => c.recorded_at),
        )
      : seriesFrom(bpDemo);

  const conditions: PatientObservationBundle["conditions"] = [];
  for (const c of patient?.chronic_diseases || []) {
    const lower = c.toLowerCase();
    if (lower.includes("diabet")) conditions.push("diabetes");
    else if (lower.includes("hyper") || lower.includes("blood pressure"))
      conditions.push("hypertension");
    else if (lower.includes("heart") || lower.includes("cardiac"))
      conditions.push("heart_disease");
    else if (lower.includes("ckd") || lower.includes("kidney"))
      conditions.push("ckd");
  }
  if (!conditions.length) conditions.push("diabetes", "hypertension");

  const dash = patientRepository.getTodayDashboard(userId);
  const appts = patientRepository.listAppointments(userId);
  const missedAppts = appts.filter((a) => a.status === "missed").length;

  return {
    patient_id: patientId || IDS.patient,
    patient_name: profile?.full_name || "Patient",
    conditions,
    medicine_adherence_percent: adherence || recovery.factors.medicine_adherence,
    missed_medicine_doses_7d: Math.max(missedMeds, adherence < 80 ? 2 : 0),
    appointment_adherence_percent: missedAppts ? 70 : 95,
    missed_appointments_30d: missedAppts,
    checkin_completion_percent: dash.progress_percent,
    blood_pressure_systolic: bpSys,
    blood_pressure_diastolic: seriesFrom([82, 84, 86, 88, 90]),
    blood_sugar: sugar,
    sleep_hours: seriesFrom(
      checkins.map((c) => c.sleep_hours).filter((v): v is number => v != null)
        .length
        ? checkins.map((c) => c.sleep_hours)
        : [6, 6.5, 7, 6, 5.5],
    ),
    water_intake_glasses: seriesFrom(
      checkins.map((c) => c.water_intake).filter((v): v is number => v != null)
        .length
        ? checkins.map((c) => c.water_intake)
        : [4, 5, 5, 6, 5],
    ),
    exercise_minutes: seriesFrom([10, 15, 12, 20, 18]),
    temperature_f: seriesFrom(
      checkins.map((c) => c.temperature).filter((v): v is number => v != null)
        .length
        ? checkins.map((c) => c.temperature)
        : [98.4, 98.6, 98.8],
    ),
    weight_kg: seriesFrom([72, 72.2, 72.4, 72.8, 73.1]),
    symptom_log: checkins.length
      ? checkins.map((c) => ({
          recorded_at: c.recorded_at,
          symptoms: c.symptoms,
          pain_score: c.pain_score,
          severity: c.symptoms.length * 2,
        }))
      : [
          { symptoms: ["Fatigue"], pain_score: 3, severity: 3 },
          { symptoms: ["Fatigue", "Headache"], pain_score: 4, severity: 5 },
        ],
    current_pain_score: checkins.at(-1)?.pain_score ?? 3,
  };
}

/** Doctor-facing helper: observations for a patient row id. */
export function buildObservationsForPatient(patientId: string) {
  return buildObservationsFromLocal(patientId);
}

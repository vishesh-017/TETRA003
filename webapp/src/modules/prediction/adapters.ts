import { getStore, IDS, todayKey } from "@/data/store";
import { applyStoredHabits } from "@/modules/patient/lifestyle-habits";
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

/** Drop impossible field readings so one bad camp entry can't pin all risks at 100. */
function sane(
  value: number | null | undefined,
  min: number,
  max: number,
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

/** Resolve store patient id from auth user id or patient row id. */
function resolvePatientRecord(userOrPatientId: string) {
  const store = getStore();
  const byPatient = store.patients.find((p) => p.id === userOrPatientId);
  if (byPatient) return byPatient;
  return store.patients.find((p) => p.user_id === userOrPatientId) ?? null;
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

function missedCheckinDays(patientId: string): number {
  const today = todayKey();
  const checkins = getStore()
    .checkins.filter((c) => c.patient_id === patientId)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  if (!checkins.length) return 3;
  const lastDay = checkins[0]!.recorded_at.slice(0, 10);
  if (lastDay >= today) return 0;
  const ms =
    new Date(`${today}T12:00:00`).getTime() -
    new Date(`${lastDay}T12:00:00`).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

/** Raw vitals/adherence — live store only (no fabricated demo series). */
export function buildRawObservationsFromLocal(
  userOrPatientId: string,
): PatientObservationBundle {
  const store = getStore();
  const patient = resolvePatientRecord(userOrPatientId);
  const patientId =
    patient?.id || patientRepository.resolvePatientId(userOrPatientId);
  const userId = patient?.user_id || userOrPatientId;
  const profile = store.profiles.find((p) => p.id === patient?.user_id);
  const recovery = patientRepository.getRecovery(userId);
  const meds = patientRepository.listMedicines(userId);
  const medUnits = meds.reduce((sum, m) => {
    if (m.today_status === "completed") return sum + 1;
    if (m.today_status === "late") return sum + 0.7;
    return sum;
  }, 0);
  const adherence = meds.length ? (medUnits / meds.length) * 100 : 72;
  const missedMeds = store.medicineEvents.filter(
    (e) => e.patient_id === patientId && e.status === "missed",
  ).length;

  const checkins = store.checkins
    .filter((c) => c.patient_id === patientId)
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at));

  const sugar = seriesFrom(
    checkins.map((c) => sane(c.blood_sugar, 40, 500)),
    checkins.map((c) => c.recorded_at),
  );
  const bpSys = seriesFrom(
    checkins.map((c) => sane(c.bp_systolic, 70, 260)),
    checkins.map((c) => c.recorded_at),
  );
  const bpDia = seriesFrom(
    checkins.map((c) => sane(c.bp_diastolic, 40, 160)),
    checkins.map((c) => c.recorded_at),
  );

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
  const discharge = store.discharges
    .filter((d) => d.patient_id === patientId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  if (!conditions.length && discharge?.diagnosis_text) {
    const d = discharge.diagnosis_text.toLowerCase();
    if (d.includes("diabet")) conditions.push("diabetes");
    if (d.includes("hyper") || d.includes("blood pressure"))
      conditions.push("hypertension");
    if (d.includes("heart") || d.includes("cardiac"))
      conditions.push("heart_disease");
    if (d.includes("ckd") || d.includes("kidney")) conditions.push("ckd");
  }

  const dash = patientRepository.getTodayDashboard(userId);
  const appts = patientRepository.listAppointments(userId);
  const missedAppts = appts.filter((a) => a.status === "missed").length;

  const sleepFromCheckins = seriesFrom(
    checkins.map((c) => sane(c.sleep_hours, 2, 14)),
    checkins.map((c) => c.recorded_at),
  );
  const waterFromCheckins = seriesFrom(
    checkins.map((c) => sane(c.water_intake, 0, 20)),
    checkins.map((c) => c.recorded_at),
  );
  const weightFromCheckins = seriesFrom(
    checkins.map((c) => sane(c.weight, 25, 250)),
    checkins.map((c) => c.recorded_at),
  );
  const tempFromCheckins = seriesFrom(
    checkins.map((c) => sane(c.temperature, 95, 106)),
    checkins.map((c) => c.recorded_at),
  );

  // Raw baseline = check-ins only. Lifestyle habits are applied separately
  // (applyStoredHabits / simulator) so before≠after when sliders move.
  return {
    patient_id: patientId || IDS.patient,
    patient_name: profile?.full_name || "Patient",
    age: ageFromDob(patient?.date_of_birth),
    sex: patient?.sex ?? null,
    conditions,
    medicine_adherence_percent: adherence || recovery.factors.medicine_adherence,
    missed_medicine_doses_7d: missedMeds,
    missed_checkin_days: missedCheckinDays(patientId),
    appointment_adherence_percent: appts.length
      ? Math.round(((appts.length - missedAppts) / appts.length) * 100)
      : 100,
    missed_appointments_30d: missedAppts,
    checkin_completion_percent: dash.progress_percent,
    blood_pressure_systolic: bpSys,
    blood_pressure_diastolic: bpDia,
    blood_sugar: sugar,
    sleep_hours: sleepFromCheckins,
    water_intake_glasses: waterFromCheckins,
    exercise_minutes: [],
    temperature_f: tempFromCheckins,
    weight_kg: weightFromCheckins,
    symptom_log: checkins.map((c) => ({
      recorded_at: c.recorded_at,
      symptoms: c.symptoms,
      pain_score: c.pain_score,
      severity: c.symptoms.length * 2,
    })),
    current_pain_score: checkins.at(-1)?.pain_score ?? null,
  };
}

/** Live observations with persisted lifestyle habits applied (AI scores). */
export function buildObservationsFromLocal(
  userOrPatientId: string,
): PatientObservationBundle {
  const raw = buildRawObservationsFromLocal(userOrPatientId);
  const patient = resolvePatientRecord(userOrPatientId);
  const patientId =
    patient?.id || patientRepository.resolvePatientId(userOrPatientId);
  return patientId ? applyStoredHabits(patientId, raw) : raw;
}

/** Doctor-facing helper: observations for a patient row id. */
export function buildObservationsForPatient(patientId: string) {
  return buildObservationsFromLocal(patientId);
}

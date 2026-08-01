import type { AlertAction, RecoveryLevel } from "./types";

export const DISCLAIMER =
  "Assistive clinical decision support only. Never diagnoses or prescribes. Clinicians remain in control.";

export const RECOVERY_WEIGHTS: Record<string, number> = {
  medicine_adherence: 0.2,
  blood_pressure: 0.12,
  blood_sugar: 0.12,
  sleep: 0.08,
  water_intake: 0.06,
  exercise: 0.08,
  symptoms: 0.1,
  pain: 0.08,
  temperature: 0.04,
  weight_trend: 0.04,
  appointment_adherence: 0.04,
  checkin_completion: 0.04,
};

export const RECOVERY_LEVEL_THRESHOLDS: Array<{
  min: number;
  level: RecoveryLevel;
}> = [
  { min: 90, level: "excellent" },
  { min: 75, level: "good" },
  { min: 60, level: "moderate" },
  { min: 40, level: "needs_attention" },
  { min: 0, level: "critical" },
];

export const ALERT_TITLES: Record<AlertAction, string> = {
  no_action: "Continue current care plan",
  monitor: "Monitor recovery closely",
  doctor_review: "Doctor review recommended",
  immediate_attention: "Immediate clinical attention advised",
  emergency: "Emergency evaluation recommended",
};

export const FOLLOW_UP =
  "Share these trends with your clinician at the next visit. Do not change medicines without medical advice.";

export const EMERGENCY_SYMPTOMS = new Set([
  "chest pain",
  "chest discomfort",
  "confusion",
  "fainting",
  "severe shortness of breath",
  "shortness of breath",
]);

export const CARDIAC_RED_FLAGS = new Set([
  "chest pain",
  "chest discomfort",
  "shortness of breath",
  "breathlessness",
  "edema",
  "swelling",
]);

export const ZERO_ADJUSTMENTS = {
  exercise_minutes_delta: 0,
  sleep_hours_delta: 0,
  water_intake_delta: 0,
  medicine_adherence_delta: 0,
  weight_kg_delta: 0,
  salt_bp_delta: 0,
  sugar_mg_delta: 0,
} as const;

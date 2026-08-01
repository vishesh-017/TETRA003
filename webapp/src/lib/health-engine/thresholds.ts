/**
 * Configurable escalation thresholds for post-discharge care.
 * Override at runtime via setEscalationThresholds() without touching engines.
 */

export interface EscalationThresholds {
  recovery_critical_below: number;
  recovery_attention_below: number;
  blood_sugar_high: number;
  blood_sugar_emergency: number;
  bp_systolic_high: number;
  bp_diastolic_high: number;
  bp_systolic_emergency: number;
  temperature_high_f: number;
  missed_medicine_doses_medium: number;
  missed_checkin_days_medium: number;
  readmission_review_percent: number;
  readmission_urgent_percent: number;
}

export const DEFAULT_ESCALATION_THRESHOLDS: EscalationThresholds = {
  recovery_critical_below: 40,
  recovery_attention_below: 60,
  blood_sugar_high: 250,
  blood_sugar_emergency: 300,
  bp_systolic_high: 160,
  bp_diastolic_high: 100,
  bp_systolic_emergency: 180,
  temperature_high_f: 101,
  missed_medicine_doses_medium: 2,
  missed_checkin_days_medium: 2,
  readmission_review_percent: 55,
  readmission_urgent_percent: 75,
};

let thresholds: EscalationThresholds = { ...DEFAULT_ESCALATION_THRESHOLDS };

export function getEscalationThresholds(): EscalationThresholds {
  return thresholds;
}

export function setEscalationThresholds(
  patch: Partial<EscalationThresholds>,
): EscalationThresholds {
  thresholds = { ...thresholds, ...patch };
  return thresholds;
}

export function resetEscalationThresholds(): EscalationThresholds {
  thresholds = { ...DEFAULT_ESCALATION_THRESHOLDS };
  return thresholds;
}

import { ALERT_TITLES, EMERGENCY_SYMPTOMS } from "./constants";
import { computeRecoveryScore } from "./recovery";
import { computeReadmissionRisk } from "./risk";
import { getEscalationThresholds } from "./thresholds";
import type {
  AlertAction,
  AlertDecisionResult,
  PatientObservationBundle,
} from "./types";
import { latest, meta } from "./utils";

/** Alert Engine — care-team actions only; never diagnoses or prescriptions. */
export function computeAlertDecision(
  obs: PatientObservationBundle,
  opts?: {
    recovery_score?: number;
    readmission_probability_percent?: number;
    missed_checkin_days?: number;
  },
): AlertDecisionResult {
  const t = getEscalationThresholds();
  const recoveryScore =
    opts?.recovery_score ?? computeRecoveryScore(obs).recovery_score;
  const readmitPct =
    opts?.readmission_probability_percent ??
    computeReadmissionRisk(obs, recoveryScore).readmission_probability_percent;

  const rationale: string[] = [];
  let action: AlertAction = "no_action";
  let urgency = 1;

  const sysV = latest(obs.blood_pressure_systolic);
  const diaV = latest(obs.blood_pressure_diastolic);
  const sugarV = latest(obs.blood_sugar);
  const tempV = latest(obs.temperature_f);
  const symptoms = obs.symptom_log?.length
    ? obs.symptom_log[obs.symptom_log.length - 1]!.symptoms.map((s) =>
        s.toLowerCase(),
      )
    : [];
  const missedMeds = obs.missed_medicine_doses_7d ?? 0;
  const missedCheckinDays = opts?.missed_checkin_days ?? 0;

  if (
    symptoms.some((s) => EMERGENCY_SYMPTOMS.has(s)) ||
    (sugarV != null && sugarV >= t.blood_sugar_emergency) ||
    (sysV != null && sysV >= t.bp_systolic_emergency)
  ) {
    action = "emergency";
    urgency = 5;
    rationale.push("Potential emergency-range vitals or red-flag symptoms");
  } else if (
    recoveryScore < t.recovery_critical_below ||
    readmitPct >= t.readmission_urgent_percent
  ) {
    action = "immediate_attention";
    urgency = 4;
    rationale.push(
      `Critical recovery/readmission signal (score=${recoveryScore.toFixed(0)}, readmit≈${readmitPct.toFixed(0)}%)`,
    );
  } else if (
    recoveryScore < t.recovery_attention_below ||
    readmitPct >= t.readmission_review_percent ||
    (sugarV != null && sugarV >= t.blood_sugar_high) ||
    (sysV != null &&
      diaV != null &&
      sysV >= t.bp_systolic_high &&
      diaV >= t.bp_diastolic_high) ||
    (sysV != null && sysV >= t.bp_systolic_high) ||
    (tempV != null && tempV >= t.temperature_high_f)
  ) {
    action = "doctor_review";
    urgency = 3;
    if (sugarV != null && sugarV >= t.blood_sugar_high) {
      rationale.push(`Blood sugar ${sugarV} mg/dL exceeds high threshold (${t.blood_sugar_high})`);
    }
    if (sysV != null && sysV >= t.bp_systolic_high) {
      rationale.push(
        `BP ${sysV}/${diaV ?? "—"} exceeds high threshold (${t.bp_systolic_high}/${t.bp_diastolic_high})`,
      );
    }
    if (tempV != null && tempV >= t.temperature_high_f) {
      rationale.push(`Temperature ${tempV}°F exceeds ${t.temperature_high_f}°F`);
    }
    if (recoveryScore < t.recovery_attention_below) {
      rationale.push(
        `Recovery score ${recoveryScore.toFixed(0)} needs attention (<${t.recovery_attention_below})`,
      );
    }
    if (!rationale.length) {
      rationale.push("Elevated deterioration signals warrant clinician review");
    }
  } else if (
    recoveryScore < 75 ||
    readmitPct >= 35 ||
    missedMeds >= t.missed_medicine_doses_medium ||
    missedCheckinDays >= t.missed_checkin_days_medium
  ) {
    action = "monitor";
    urgency = 2;
    if (missedMeds >= t.missed_medicine_doses_medium) {
      rationale.push(
        `${missedMeds} missed medicine dose(s) in recent window (threshold ${t.missed_medicine_doses_medium})`,
      );
    }
    if (missedCheckinDays >= t.missed_checkin_days_medium) {
      rationale.push(
        `${missedCheckinDays} day(s) without check-in (threshold ${t.missed_checkin_days_medium})`,
      );
    }
    if (!rationale.length) {
      rationale.push("Mild-moderate risk — continue close monitoring");
    }
  } else {
    action = "no_action";
    urgency = 1;
    rationale.push("No escalation thresholds crossed");
  }

  if (
    (obs.missed_appointments_30d ?? 0) > 0 &&
    (action === "no_action" || action === "monitor")
  ) {
    action = "monitor";
    urgency = Math.max(urgency, 2);
    rationale.push("Missed appointment increases need for outreach");
  }

  const title = ALERT_TITLES[action];

  return {
    action,
    urgency,
    title,
    rationale,
    clinician_message: `Assistive alert: ${title}. Recovery≈${recoveryScore.toFixed(0)}/100, readmission≈${readmitPct.toFixed(0)}%. Final decision remains with the clinician.`,
    patient_message:
      "Based on your recent logs, your care team may want to review your progress. This is not a diagnosis — follow your approved care plan and seek urgent care for emergency warning signs.",
    meta: meta("alert_decision", "threshold_policy_v2"),
  };
}

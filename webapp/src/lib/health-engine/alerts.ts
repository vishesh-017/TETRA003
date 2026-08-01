import { ALERT_TITLES, EMERGENCY_SYMPTOMS } from "./constants";
import { computeRecoveryScore } from "./recovery";
import { computeReadmissionRisk } from "./risk";
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
  },
): AlertDecisionResult {
  const recoveryScore =
    opts?.recovery_score ?? computeRecoveryScore(obs).recovery_score;
  const readmitPct =
    opts?.readmission_probability_percent ??
    computeReadmissionRisk(obs, recoveryScore).readmission_probability_percent;

  const rationale: string[] = [];
  let action: AlertAction = "no_action";
  let urgency = 1;

  const sysV = latest(obs.blood_pressure_systolic);
  const sugarV = latest(obs.blood_sugar);
  const symptoms = obs.symptom_log?.length
    ? obs.symptom_log[obs.symptom_log.length - 1]!.symptoms.map((s) =>
        s.toLowerCase(),
      )
    : [];

  if (
    symptoms.some((s) => EMERGENCY_SYMPTOMS.has(s)) ||
    (sugarV != null && sugarV >= 300) ||
    (sysV != null && sysV >= 180)
  ) {
    action = "emergency";
    urgency = 5;
    rationale.push("Potential emergency-range vitals or red-flag symptoms");
  } else if (recoveryScore < 40 || readmitPct >= 75) {
    action = "immediate_attention";
    urgency = 4;
    rationale.push(
      `Critical recovery/readmission signal (score=${recoveryScore.toFixed(0)}, readmit≈${readmitPct.toFixed(0)}%)`,
    );
  } else if (recoveryScore < 60 || readmitPct >= 55) {
    action = "doctor_review";
    urgency = 3;
    rationale.push("Elevated deterioration signals warrant clinician review");
  } else if (
    recoveryScore < 75 ||
    readmitPct >= 35 ||
    (obs.missed_medicine_doses_7d ?? 0) >= 2
  ) {
    action = "monitor";
    urgency = 2;
    rationale.push("Mild-moderate risk — continue close monitoring");
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
    meta: meta("alert_decision", "threshold_policy_v1"),
  };
}

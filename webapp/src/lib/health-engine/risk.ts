import { computeRecoveryScore } from "./recovery";
import type {
  ContributingFactor,
  PatientObservationBundle,
  ReadmissionRiskResult,
  RiskCategory,
} from "./types";
import {
  clamp,
  consecutiveRising,
  latest,
  meta,
  seriesValues,
  trendDirection,
} from "./utils";

/** Readmission Risk Engine — Low / Medium / High / Critical. */
export function computeReadmissionRisk(
  obs: PatientObservationBundle,
  recoveryScore?: number,
): ReadmissionRiskResult {
  const score =
    recoveryScore ?? computeRecoveryScore(obs).recovery_score;

  let base = clamp(100 - score * 0.85);
  const explanations: string[] = [];
  const factors: ContributingFactor[] = [];

  const sugarVals = seriesValues(obs.blood_sugar);
  const sugarStreak = consecutiveRising(sugarVals, 3);
  if (trendDirection(sugarVals) === "increasing") {
    base += 8;
    explanations.push("Blood sugar shows an increasing trend");
    factors.push({
      factor: "blood_sugar_trend",
      impact: "negative",
      weight: 0.2,
      detail: "Rising glucose pattern",
      evidence: `Consecutive rises noted: ${sugarStreak}`,
    });
  }
  if (sugarStreak >= 2) {
    base += 6;
    explanations.push(
      `Sugar increased across ${sugarStreak + 1} consecutive readings`,
    );
  }

  const sysV = latest(obs.blood_pressure_systolic);
  if (sysV != null && sysV >= 150) {
    base += 10;
    explanations.push("Blood pressure remains uncontrolled (systolic ≥ 150)");
    factors.push({
      factor: "blood_pressure",
      impact: "negative",
      weight: 0.18,
      detail: `Latest systolic ${sysV.toFixed(0)}`,
    });
  }

  const missedMeds = obs.missed_medicine_doses_7d ?? 0;
  if (missedMeds >= 2) {
    base += Math.min(14, missedMeds * 4);
    explanations.push(`${missedMeds} medicine doses missed in 7 days`);
    factors.push({
      factor: "medicine_adherence",
      impact: "negative",
      weight: 0.22,
      detail: "Repeated missed medicines",
    });
  }

  const log = obs.symptom_log ?? [];
  if (log.length) {
    const last = log[log.length - 1]!;
    if (last.symptoms.length >= 2 || (last.severity ?? 0) >= 6) {
      base += 8;
      explanations.push("Worsening or multi-symptom burden reported");
      factors.push({
        factor: "symptoms",
        impact: "negative",
        weight: 0.15,
        detail: "Elevated symptom burden",
      });
    }
  }

  const missedAppt = obs.missed_appointments_30d ?? 0;
  if (missedAppt >= 1) {
    base += 7;
    explanations.push("Missed follow-up appointment(s)");
    factors.push({
      factor: "appointments",
      impact: "negative",
      weight: 0.12,
      detail: `Missed appointments (30d): ${missedAppt}`,
    });
  }

  if (score < 60) {
    base += 8;
    explanations.push(`Recovery Score decreased / low (${score.toFixed(0)}/100)`);
    factors.push({
      factor: "recovery_score",
      impact: "negative",
      weight: 0.2,
      detail: `Recovery Score ${score.toFixed(0)}`,
    });
  }

  const probability = Number(clamp(base).toFixed(1));
  const category = riskCategory(probability);

  if (!explanations.length) {
    explanations.push(
      "No major deterioration flags; continue monitoring per care plan",
    );
    factors.push({
      factor: "baseline",
      impact: "neutral",
      weight: 0.1,
      detail: "Stable observation window",
    });
  }

  return {
    readmission_probability_percent: probability,
    risk_category: category,
    explanation: explanations,
    contributing_factors: factors,
    summary: `Estimated readmission probability is ${probability.toFixed(0)}% (${category}). Key driver: ${explanations[0]}.`,
    meta: meta("readmission_risk", "risk_rules_v1"),
  };
}

export function riskCategory(pct: number): RiskCategory {
  if (pct >= 75) return "critical";
  if (pct >= 55) return "high";
  if (pct >= 35) return "medium";
  return "low";
}

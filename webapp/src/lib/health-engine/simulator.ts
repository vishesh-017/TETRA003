import { computeDiseaseProgression } from "./disease";
import { computeRecoveryScore } from "./recovery";
import { computeReadmissionRisk } from "./risk";
import type {
  LifestyleAdjustments,
  LifestyleSimulationResult,
  PatientObservationBundle,
  ScenarioSnapshot,
  TimedValue,
} from "./types";
import { clamp, cloneObservations, meta } from "./utils";

/** Lifestyle Simulator — instant counterfactual, no network. */
export function simulateLifestyle(
  baseline: PatientObservationBundle,
  adjustments: LifestyleAdjustments,
): LifestyleSimulationResult {
  const before = snapshot(baseline);
  const adjusted = applyAdjustments(baseline, adjustments);
  const after = snapshot(adjusted);

  const deltas = {
    recovery_score: Number(
      (after.recovery_score - before.recovery_score).toFixed(1),
    ),
    readmission_probability_percent: Number(
      (
        after.readmission_probability_percent -
        before.readmission_probability_percent
      ).toFixed(1),
    ),
  };

  return {
    before,
    after,
    deltas,
    interpretation: interpret(deltas),
    chart_series: [
      {
        metric: "Recovery Score",
        before: before.recovery_score,
        after: after.recovery_score,
      },
      {
        metric: "Readmission %",
        before: before.readmission_probability_percent,
        after: after.readmission_probability_percent,
      },
    ],
    meta: meta("lifestyle_simulator", "counterfactual_rules_v1"),
  };
}

export function applyAdjustments(
  baseline: PatientObservationBundle,
  adj: LifestyleAdjustments,
): PatientObservationBundle {
  const adjusted = cloneObservations(baseline);
  const baseAdherence = adjusted.medicine_adherence_percent ?? 70;
  adjusted.medicine_adherence_percent = clamp(
    baseAdherence + adj.medicine_adherence_delta,
  );

  bumpSeries(adjusted, "exercise_minutes", adj.exercise_minutes_delta, 15);
  bumpSeries(adjusted, "sleep_hours", adj.sleep_hours_delta, 6.5);
  bumpSeries(adjusted, "water_intake_glasses", adj.water_intake_delta, 5);
  bumpSeries(adjusted, "weight_kg", adj.weight_kg_delta, 70);

  return adjusted;
}

function bumpSeries(
  obs: PatientObservationBundle,
  key:
    | "exercise_minutes"
    | "sleep_hours"
    | "water_intake_glasses"
    | "weight_kg",
  delta: number,
  fallback: number,
): void {
  if (Math.abs(delta) < 1e-9) return;
  const series: TimedValue[] = [...(obs[key] ?? [])];
  if (series.length) {
    const last = series[series.length - 1]!;
    series.push({
      recorded_at: last.recorded_at,
      value: Math.max(0, last.value + delta),
    });
  } else {
    series.push({ value: Math.max(0, fallback + delta) });
  }
  obs[key] = series;
}

function snapshot(obs: PatientObservationBundle): ScenarioSnapshot {
  const recovery = computeRecoveryScore(obs);
  const readmit = computeReadmissionRisk(obs, recovery.recovery_score);
  const progress = computeDiseaseProgression(obs);
  return {
    recovery_score: recovery.recovery_score,
    recovery_level: recovery.recovery_level,
    readmission_probability_percent: readmit.readmission_probability_percent,
    risk_category: readmit.risk_category,
    overall_worsening_risk: progress.overall_worsening_risk,
  };
}

function interpret(deltas: Record<string, number>): string {
  const rec = deltas.recovery_score ?? 0;
  const risk = deltas.readmission_probability_percent ?? 0;
  const parts: string[] = [];
  if (rec > 0) parts.push(`Recovery Score may improve by about ${rec.toFixed(0)} points.`);
  else if (rec < 0)
    parts.push(`Recovery Score may drop by about ${Math.abs(rec).toFixed(0)} points.`);
  else parts.push("Recovery Score stays roughly unchanged.");
  if (risk < 0)
    parts.push(
      `Readmission probability may fall by about ${Math.abs(risk).toFixed(0)}%.`,
    );
  else if (risk > 0)
    parts.push(`Readmission probability may rise by about ${risk.toFixed(0)}%.`);
  parts.push("This is a simulation for education — not a medical prescription.");
  return parts.join(" ");
}

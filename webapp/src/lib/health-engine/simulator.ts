import { computeDiseaseProgression } from "./disease";
import { computeRecoveryScore } from "./recovery";
import { computeReadmissionRisk } from "./risk";
import type {
  DiseaseScoreSnapshot,
  LifestyleAdjustments,
  LifestyleSimulationResult,
  PatientObservationBundle,
  ScenarioSnapshot,
  TimedValue,
} from "./types";
import { clamp, cloneObservations, latest, meta } from "./utils";

/** Lifestyle Simulator — instant counterfactual, no network. */
export function simulateLifestyle(
  baseline: PatientObservationBundle,
  adjustments: LifestyleAdjustments,
): LifestyleSimulationResult {
  const before = snapshot(baseline);
  const adjusted = applyAdjustments(baseline, adjustments);
  const after = snapshot(adjusted);
  const disease_scores = diseaseScoreCompare(baseline, adjusted);
  const peakBefore = Math.max(...disease_scores.map((d) => d.before), 0);
  const peakAfter = Math.max(...disease_scores.map((d) => d.after), 0);
  const peak_risk_drop = Math.round(peakBefore - peakAfter);

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
    peak_risk: peak_risk_drop,
  };

  return {
    before,
    after,
    deltas,
    interpretation: interpret(deltas, peak_risk_drop),
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
    disease_scores,
    peak_risk_drop,
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

  const salt = adj.salt_bp_delta ?? 0;
  const sugar = adj.sugar_mg_delta ?? 0;
  if (Math.abs(salt) > 1e-9) {
    bumpSeries(adjusted, "blood_pressure_systolic", salt, 130);
    bumpSeries(adjusted, "blood_pressure_diastolic", salt * 0.45, 82);
  }
  if (Math.abs(sugar) > 1e-9) {
    bumpSeries(adjusted, "blood_sugar", sugar, 140);
  }

  return adjusted;
}

function bumpSeries(
  obs: PatientObservationBundle,
  key:
    | "exercise_minutes"
    | "sleep_hours"
    | "water_intake_glasses"
    | "weight_kg"
    | "blood_pressure_systolic"
    | "blood_pressure_diastolic"
    | "blood_sugar",
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

function diseaseScoreCompare(
  before: PatientObservationBundle,
  after: PatientObservationBundle,
): DiseaseScoreSnapshot[] {
  const labels = [
    { key: "diabetes", label: "Diabetes" },
    { key: "hypertension", label: "Hypertension" },
    { key: "ckd", label: "CKD" },
    { key: "heart_disease", label: "Cardiovascular" },
    { key: "stroke", label: "Stroke" },
  ] as const;

  return labels.map(({ key, label }) => {
    const b = scoreCondition(key, before);
    const a = scoreCondition(key, after);
    return {
      label,
      before: b,
      after: a,
      delta: a - b,
    };
  });
}

function scoreCondition(
  key: "diabetes" | "hypertension" | "ckd" | "heart_disease" | "stroke",
  obs: PatientObservationBundle,
): number {
  const sugar = latest(obs.blood_sugar) ?? 140;
  const sys = latest(obs.blood_pressure_systolic) ?? 130;
  const dia = latest(obs.blood_pressure_diastolic) ?? 82;
  const adherence = obs.medicine_adherence_percent ?? 70;
  const sleep = latest(obs.sleep_hours) ?? 6.5;
  const exercise = latest(obs.exercise_minutes) ?? 15;
  const weightDelta = (() => {
    const series = obs.weight_kg ?? [];
    if (series.length < 2) return 0;
    return series[series.length - 1]!.value - series[0]!.value;
  })();

  let score = 40;
  if (key === "diabetes") {
    score = clamp(sugar * 0.45 + (100 - adherence) * 0.35 + (sugar > 160 ? 15 : 0));
  } else if (key === "hypertension") {
    score = clamp(sys * 0.42 + dia * 0.15 + (100 - adherence) * 0.2);
  } else if (key === "ckd") {
    score = clamp(
      sugar * 0.2 + sys * 0.25 + (weightDelta > 0 ? 12 : 0) + (100 - adherence) * 0.25,
    );
  } else if (key === "heart_disease") {
    score = clamp(
      sys * 0.28 +
        (100 - adherence) * 0.25 +
        (exercise < 20 ? 12 : 0) +
        (sleep < 6 ? 10 : 0) +
        sugar * 0.12,
    );
  } else {
    score = clamp(
      sys * 0.3 + sugar * 0.15 + (100 - adherence) * 0.2 + (sleep < 6 ? 12 : 8),
    );
  }
  return Math.round(score);
}

function interpret(deltas: Record<string, number>, peakDrop: number): string {
  const rec = deltas.recovery_score ?? 0;
  const risk = deltas.readmission_probability_percent ?? 0;
  const parts: string[] = [];
  if (peakDrop > 0) {
    parts.push(`Overall peak risk score would drop by ${peakDrop} points.`);
  } else if (peakDrop < 0) {
    parts.push(
      `Overall peak risk score would rise by ${Math.abs(peakDrop)} points.`,
    );
  } else {
    parts.push("Overall peak risk score would drop by 0 points.");
  }
  if (rec > 0)
    parts.push(`Recovery Score may improve by about ${rec.toFixed(0)} points.`);
  else if (rec < 0)
    parts.push(
      `Recovery Score may drop by about ${Math.abs(rec).toFixed(0)} points.`,
    );
  if (risk < 0)
    parts.push(
      `Readmission probability may fall by about ${Math.abs(risk).toFixed(0)}%.`,
    );
  else if (risk > 0)
    parts.push(
      `Readmission probability may rise by about ${risk.toFixed(0)}%.`,
    );
  parts.push(
    "This is an educational estimate using simplified rules — not a medical prediction.",
  );
  return parts.join(" ");
}

import { RECOVERY_LEVEL_THRESHOLDS, RECOVERY_WEIGHTS } from "./constants";
import type {
  ContributingFactor,
  PatientObservationBundle,
  RecoveryLevel,
  RecoveryScoreResult,
} from "./types";
import {
  clamp,
  inversePainScore,
  latest,
  meta,
  pctOrDefault,
  scoreFromRange,
  seriesValues,
  trendDirection,
} from "./utils";

/** Recovery Score Engine — weighted 0–100 post-discharge KPI. */
export function computeRecoveryScore(
  obs: PatientObservationBundle,
): RecoveryScoreResult {
  const factorScores: Record<string, number> = {};
  const factors: ContributingFactor[] = [];

  let med = pctOrDefault(obs.medicine_adherence_percent, 65);
  const missed = obs.missed_medicine_doses_7d ?? 0;
  if (missed >= 3) med = clamp(med - 15);
  factorScores.medicine_adherence = med;
  factors.push({
    factor: "medicine_adherence",
    impact: med >= 80 ? "positive" : "negative",
    weight: RECOVERY_WEIGHTS.medicine_adherence!,
    detail: `Adherence ≈ ${med.toFixed(0)}%`,
    evidence: `Missed doses (7d): ${missed}`,
  });

  const sysV = latest(obs.blood_pressure_systolic);
  const bp = scoreFromRange(sysV, {
    idealLow: 110,
    idealHigh: 130,
    warnLow: 95,
    warnHigh: 150,
  });
  factorScores.blood_pressure = bp;
  factors.push({
    factor: "blood_pressure",
    impact: bp >= 75 ? "positive" : "negative",
    weight: RECOVERY_WEIGHTS.blood_pressure!,
    detail: `Latest systolic: ${sysV ?? "n/a"}`,
  });

  const sugarV = latest(obs.blood_sugar);
  let sugar = scoreFromRange(sugarV, {
    idealLow: 80,
    idealHigh: 140,
    warnLow: 70,
    warnHigh: 180,
  });
  const sugarVals = seriesValues(obs.blood_sugar);
  const sugarTrend = trendDirection(sugarVals);
  if (sugarTrend === "increasing") sugar = clamp(sugar - 12);
  factorScores.blood_sugar = sugar;
  factors.push({
    factor: "blood_sugar",
    impact: sugar >= 75 ? "positive" : "negative",
    weight: RECOVERY_WEIGHTS.blood_sugar!,
    detail: `Latest sugar: ${sugarV ?? "n/a"}`,
    evidence: `Trend: ${sugarTrend}`,
  });

  const sleepV = latest(obs.sleep_hours);
  const sleep = scoreFromRange(sleepV, {
    idealLow: 7,
    idealHigh: 9,
    warnLow: 5,
    warnHigh: 11,
  });
  factorScores.sleep = sleep;
  factors.push({
    factor: "sleep",
    impact: sleep >= 75 ? "positive" : "negative",
    weight: RECOVERY_WEIGHTS.sleep!,
    detail: `Latest sleep hours: ${sleepV ?? "n/a"}`,
  });

  const waterV = latest(obs.water_intake_glasses);
  const water = scoreFromRange(waterV, {
    idealLow: 6,
    idealHigh: 10,
    warnLow: 3,
    warnHigh: 14,
  });
  factorScores.water_intake = water;
  factors.push({
    factor: "water_intake",
    impact: water >= 70 ? "positive" : "neutral",
    weight: RECOVERY_WEIGHTS.water_intake!,
    detail: `Glasses/day: ${waterV ?? "n/a"}`,
  });

  const exV = latest(obs.exercise_minutes);
  const exercise = scoreFromRange(exV, {
    idealLow: 20,
    idealHigh: 45,
    warnLow: 5,
    warnHigh: 90,
  });
  factorScores.exercise = exercise;
  factors.push({
    factor: "exercise",
    impact: exercise >= 70 ? "positive" : "negative",
    weight: RECOVERY_WEIGHTS.exercise!,
    detail: `Minutes: ${exV ?? "n/a"}`,
  });

  let symptoms: number;
  const log = obs.symptom_log ?? [];
  if (log.length) {
    const last = log[log.length - 1]!;
    const count = last.symptoms.length;
    const sev = last.severity ?? Math.min(10, count * 2);
    symptoms = clamp(100 - count * 12 - sev * 4);
  } else {
    symptoms = 78;
  }
  factorScores.symptoms = symptoms;
  factors.push({
    factor: "symptoms",
    impact: symptoms >= 75 ? "positive" : "negative",
    weight: RECOVERY_WEIGHTS.symptoms!,
    detail: `Symptom burden score ${symptoms.toFixed(0)}/100`,
  });

  let pain = inversePainScore(obs.current_pain_score);
  if (log.length && log[log.length - 1]!.pain_score != null) {
    pain = inversePainScore(log[log.length - 1]!.pain_score);
  }
  factorScores.pain = pain;
  factors.push({
    factor: "pain",
    impact: pain >= 70 ? "positive" : "negative",
    weight: RECOVERY_WEIGHTS.pain!,
    detail: `Pain contribution ${pain.toFixed(0)}/100`,
  });

  const tempV = latest(obs.temperature_f);
  const temp = scoreFromRange(tempV, {
    idealLow: 97.5,
    idealHigh: 99,
    warnLow: 96.5,
    warnHigh: 100.4,
  });
  factorScores.temperature = temp;
  factors.push({
    factor: "temperature",
    impact: temp >= 70 ? "neutral" : "negative",
    weight: RECOVERY_WEIGHTS.temperature!,
    detail: `Temp °F: ${tempV ?? "n/a"}`,
  });

  const wVals = seriesValues(obs.weight_kg);
  const wDir = trendDirection(wVals, 0.4);
  let weight: number;
  if (wDir === "increasing") weight = 55;
  else if (wDir === "decreasing") weight = 72;
  else if (wDir === "stable") weight = 85;
  else weight = 70;
  factorScores.weight_trend = weight;
  factors.push({
    factor: "weight_trend",
    impact: weight >= 75 ? "positive" : "negative",
    weight: RECOVERY_WEIGHTS.weight_trend!,
    detail: `Weight trend: ${wDir}`,
  });

  let appt = pctOrDefault(obs.appointment_adherence_percent, 70);
  const missedAppt = obs.missed_appointments_30d ?? 0;
  if (missedAppt) appt = clamp(appt - missedAppt * 12);
  factorScores.appointment_adherence = appt;
  factors.push({
    factor: "appointment_adherence",
    impact: appt >= 80 ? "positive" : "negative",
    weight: RECOVERY_WEIGHTS.appointment_adherence!,
    detail: `Appointment adherence ≈ ${appt.toFixed(0)}%`,
  });

  const checkin = pctOrDefault(obs.checkin_completion_percent, 65);
  factorScores.checkin_completion = checkin;
  factors.push({
    factor: "checkin_completion",
    impact: checkin >= 75 ? "positive" : "neutral",
    weight: RECOVERY_WEIGHTS.checkin_completion!,
    detail: `Check-in completion ≈ ${checkin.toFixed(0)}%`,
  });

  const score = Number(
    clamp(
      Object.keys(RECOVERY_WEIGHTS).reduce(
        (sum, key) => sum + (factorScores[key] ?? 55) * (RECOVERY_WEIGHTS[key] ?? 0),
        0,
      ),
    ).toFixed(1),
  );
  const level = recoveryLevel(score);
  const top = [...factors].sort((a, b) => b.weight - a.weight).slice(0, 5);
  const summary = `Recovery Score is ${score.toFixed(0)}/100 (${level.replaceAll("_", " ")}). Strongest drivers: ${top
    .slice(0, 3)
    .map((t) => t.factor.replaceAll("_", " "))
    .join(", ")}.`;

  return {
    recovery_score: score,
    recovery_level: level,
    contributing_factors: factors,
    factor_scores: Object.fromEntries(
      Object.entries(factorScores).map(([k, v]) => [k, Number(v.toFixed(1))]),
    ),
    summary,
    meta: meta("recovery_score", "weighted_rule_v1"),
  };
}

export function recoveryLevel(score: number): RecoveryLevel {
  for (const row of RECOVERY_LEVEL_THRESHOLDS) {
    if (score >= row.min) return row.level;
  }
  return "critical";
}

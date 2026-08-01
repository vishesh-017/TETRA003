import { FOLLOW_UP, CARDIAC_RED_FLAGS } from "./constants";
import type {
  Condition,
  ConditionProgression,
  DiseaseProgressionResult,
  PatientObservationBundle,
  ProgressRisk,
} from "./types";
import { latest, meta, seriesValues, trendDirection } from "./utils";

const ORDER: ProgressRisk[] = ["low", "moderate", "high", "critical"];

function escalate(risk: ProgressRisk): ProgressRisk {
  const idx = ORDER.indexOf(risk);
  return ORDER[Math.min(idx + 1, ORDER.length - 1)]!;
}

function worst(risks: ProgressRisk[]): ProgressRisk {
  return risks.reduce((a, b) => (ORDER.indexOf(b) > ORDER.indexOf(a) ? b : a), "low");
}

/** Disease Progression Engine — diabetes / HTN / heart / CKD. */
export function computeDiseaseProgression(
  obs: PatientObservationBundle,
  focus?: Condition[],
): DiseaseProgressionResult {
  const raw =
    focus?.length
      ? focus
      : (obs.conditions?.length ? obs.conditions : ["diabetes", "hypertension"]);
  const conditions = raw.filter(
    (c): c is Exclude<Condition, "other"> =>
      c === "diabetes" ||
      c === "hypertension" ||
      c === "heart_disease" ||
      c === "ckd",
  );
  const list = conditions.length
    ? conditions
    : (["diabetes", "hypertension"] as const);

  const assessments = list.map((c) => assess(c, obs));
  const overall = worst(assessments.map((a) => a.risk));

  return {
    assessments,
    overall_worsening_risk: overall,
    summary: `Overall worsening risk is ${overall}. ${assessments
      .map((a) => `${a.condition}: ${a.risk}.`)
      .join(" ")}`,
    meta: meta("disease_progression", "condition_rules_v1"),
  };
}

function assess(
  condition: Exclude<Condition, "other">,
  obs: PatientObservationBundle,
): ConditionProgression {
  if (condition === "diabetes") return diabetes(obs);
  if (condition === "hypertension") return hypertension(obs);
  if (condition === "heart_disease") return heart(obs);
  return ckd(obs);
}

function diabetes(obs: PatientObservationBundle): ConditionProgression {
  const sugar = seriesValues(obs.blood_sugar);
  const direction = trendDirection(sugar);
  const last = latest(obs.blood_sugar);
  const adherence = obs.medicine_adherence_percent ?? 70;
  let risk: ProgressRisk = "low";
  let confidence = 0.55;
  const reasons: string[] = [];

  if (direction === "increasing") {
    risk = "moderate";
    confidence = 0.7;
    reasons.push("glucose trend increasing");
  }
  if (last != null && last >= 180) {
    risk = "high";
    confidence = 0.8;
    reasons.push(`latest sugar ${last.toFixed(0)}`);
  }
  if (last != null && last >= 250) {
    risk = "critical";
    confidence = 0.85;
    reasons.push("markedly elevated glucose");
  }
  if (adherence < 70) {
    risk = escalate(risk);
    reasons.push("medicine adherence below 70%");
    confidence = Math.min(0.9, confidence + 0.05);
  }

  return {
    condition: "diabetes",
    risk,
    reason: reasons.join("; ") || "No strong diabetes worsening signals in provided data",
    confidence,
    recommendation: `Request clinician review of recent glucose log and adherence. ${FOLLOW_UP}`,
  };
}

function hypertension(obs: PatientObservationBundle): ConditionProgression {
  const sysVals = seriesValues(obs.blood_pressure_systolic);
  const direction = trendDirection(sysVals);
  const last = latest(obs.blood_pressure_systolic);
  let risk: ProgressRisk = "low";
  let confidence = 0.55;
  const reasons: string[] = [];

  if (direction === "increasing") {
    risk = "moderate";
    reasons.push("systolic BP trending up");
    confidence = 0.68;
  }
  if (last != null && last >= 150) {
    risk = "high";
    reasons.push(`latest systolic ${last.toFixed(0)}`);
    confidence = 0.78;
  }
  if (last != null && last >= 180) {
    risk = "critical";
    reasons.push("severe hypertension range");
    confidence = 0.88;
  }

  return {
    condition: "hypertension",
    risk,
    reason: reasons.join("; ") || "BP pattern does not show clear worsening",
    confidence,
    recommendation: `Bring home BP diary to follow-up; confirm measurement technique. ${FOLLOW_UP}`,
  };
}

function heart(obs: PatientObservationBundle): ConditionProgression {
  const pain = obs.current_pain_score;
  const symptoms = obs.symptom_log?.length
    ? obs.symptom_log[obs.symptom_log.length - 1]!.symptoms
    : [];
  const hits = symptoms.filter((s) => CARDIAC_RED_FLAGS.has(s.toLowerCase()));
  let risk: ProgressRisk = "low";
  let confidence = 0.5;
  const reasons: string[] = [];

  if (hits.length) {
    risk = "high";
    confidence = 0.75;
    reasons.push(`reported cardiac-suggestive symptoms: ${hits.join(", ")}`);
  }
  if (pain != null && pain >= 7) {
    risk = escalate(risk);
    reasons.push(`high pain score ${pain}`);
    confidence = Math.min(0.9, confidence + 0.1);
  }
  if ((obs.missed_medicine_doses_7d ?? 0) >= 3) {
    risk = escalate(risk);
    reasons.push("repeated missed medicines");
  }

  return {
    condition: "heart_disease",
    risk,
    reason:
      reasons.join("; ") || "No strong cardiac worsening flags in provided logs",
    confidence,
    recommendation: `Seek urgent clinical care for chest pain or severe breathlessness. Otherwise schedule prompt clinician review. ${FOLLOW_UP}`,
  };
}

function ckd(obs: PatientObservationBundle): ConditionProgression {
  const sysV = latest(obs.blood_pressure_systolic);
  const wDir = trendDirection(seriesValues(obs.weight_kg), 0.3);
  let risk: ProgressRisk = "low";
  let confidence = 0.45;
  const reasons: string[] = [];

  if (sysV != null && sysV >= 150) {
    risk = "moderate";
    reasons.push("elevated BP can stress kidney recovery");
    confidence = 0.6;
  }
  if (wDir === "increasing") {
    risk = escalate(risk);
    reasons.push("weight increasing (possible fluid retention signal)");
    confidence = Math.min(0.75, confidence + 0.1);
  }
  if (
    obs.medicine_adherence_percent != null &&
    obs.medicine_adherence_percent < 70
  ) {
    risk = escalate(risk);
    reasons.push("suboptimal adherence");
  }

  return {
    condition: "ckd",
    risk,
    reason:
      reasons.join("; ") ||
      "Limited CKD-specific labs; no strong proxy worsening signals",
    confidence,
    recommendation: `Discuss kidney follow-up labs and fluid guidance with your clinician. ${FOLLOW_UP}`,
  };
}

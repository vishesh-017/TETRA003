import type {
  ClinicalTrend,
  PatientObservationBundle,
  TimedValue,
  TrendAnalysisResult,
  TrendDirection,
  TrendItem,
} from "./types";
import { meta, seriesValues, toClinicalTrend, trendDirection } from "./utils";

const CLINICAL_LABEL: Record<ClinicalTrend, string> = {
  improving: "Improving",
  stable: "Stable",
  declining: "Worsening",
  insufficient: "Insufficient Data",
};

const DIRECTION_LABEL: Record<string, string> = {
  increasing: "Rising",
  decreasing: "Falling",
  stable: "Stable",
  insufficient: "Insufficient Data",
};

/** Trend Detection — Improving / Stable / Declining summaries. */
export function computeTrendAnalysis(
  obs: PatientObservationBundle,
): TrendAnalysisResult {
  const trends: TrendItem[] = [
    metric("blood_sugar", "Blood Sugar", obs.blood_sugar, true),
    metric(
      "blood_pressure_systolic",
      "Blood Pressure",
      obs.blood_pressure_systolic,
      true,
    ),
    adherenceTrend(obs.medicine_adherence_percent),
    symptomTrend(obs),
    metric("weight_kg", "Weight", obs.weight_kg, null),
    metric("sleep_hours", "Sleep", obs.sleep_hours, false),
  ];

  const bits = trends
    .filter((t) => t.clinical_trend !== "insufficient")
    .map((t) => t.natural_language);

  return {
    trends,
    narrative_summary: bits.length
      ? bits.slice(0, 4).join(" ")
      : "Insufficient longitudinal data for a trend narrative.",
    meta: meta("trend_analysis", "series_rules_v1"),
  };
}

function metric(
  key: string,
  label: string,
  series: TimedValue[] | undefined,
  risingBad: boolean | null,
): TrendItem {
  const values = seriesValues(series);
  const direction = trendDirection(values);
  const clinical = toClinicalTrend(direction, risingBad);
  const nl = narrative(label, direction, clinical);

  const dirLabel = DIRECTION_LABEL[direction] || CLINICAL_LABEL[clinical];
  return {
    metric: key,
    direction,
    clinical_trend: clinical,
    // Chart title follows the plotted series direction (Rising/Falling),
    // while clinical_trend remains Improving/Worsening for badges.
    label: `${label} ${dirLabel}`,
    natural_language: nl,
    points: (series ?? []).slice(-14).map((p, i) => ({
      index: i + 1,
      value: p.value,
      recorded_at: p.recorded_at ?? null,
    })),
  };
}

function narrative(
  label: string,
  direction: TrendDirection,
  clinical: ClinicalTrend,
): string {
  if (direction === "insufficient") {
    return `Not enough ${label.toLowerCase()} points to detect a reliable trend.`;
  }
  if (clinical === "stable" || direction === "stable") {
    return `${label} appears stable across recent readings.`;
  }
  const dir = DIRECTION_LABEL[direction]?.toLowerCase() || direction;
  const clinicalWord = clinical === "declining" ? "worsening" : clinical;
  return `${label} is ${dir} — clinical status ${clinicalWord}.`;
}

function adherenceTrend(adherence: number | null | undefined): TrendItem {
  if (adherence == null) {
    return {
      metric: "medicine_adherence",
      direction: "insufficient",
      clinical_trend: "insufficient",
      label: "Medicine Adherence Insufficient Data",
      natural_language: "Medicine adherence percentage was not provided.",
      points: [],
    };
  }

  let clinical: ClinicalTrend;
  let direction: TrendDirection;
  if (adherence >= 85) {
    clinical = "improving";
    direction = "stable";
  } else if (adherence >= 70) {
    clinical = "stable";
    direction = "stable";
  } else {
    clinical = "declining";
    direction = "decreasing";
  }

  return {
    metric: "medicine_adherence",
    direction,
    clinical_trend: clinical,
    label: `Medicine Adherence ${CLINICAL_LABEL[clinical]}`,
    natural_language: `Medicine adherence is ${clinical} at about ${adherence.toFixed(0)}%.`,
    points: [{ index: 1, value: adherence, recorded_at: null }],
  };
}

function symptomTrend(obs: PatientObservationBundle): TrendItem {
  const log = obs.symptom_log ?? [];
  if (log.length < 2) {
    return {
      metric: "symptoms",
      direction: "insufficient",
      clinical_trend: "insufficient",
      label: "Symptoms Insufficient Data",
      natural_language: "Need more symptom check-ins to judge symptom trend.",
      points: [],
    };
  }

  const scores = log.map((s) => {
    const sev = s.severity ?? s.symptoms.length * 2;
    return sev + (s.pain_score ?? 0);
  });
  const direction = trendDirection(scores);
  const clinical = toClinicalTrend(direction, true);

  return {
    metric: "symptoms",
    direction,
    clinical_trend: clinical,
    label: `Symptoms ${CLINICAL_LABEL[clinical]}`,
    natural_language: `Symptom burden is ${clinical} across recent check-ins.`,
    points: scores.slice(-14).map((v, i) => ({
      index: i + 1,
      value: v,
      recorded_at: null,
    })),
  };
}

import type { AnalyticsCharts } from "@/types/domain";

/** MVP analytics: exactly three charts. */
export function emptyAnalyticsCharts(): AnalyticsCharts {
  return {
    blood_sugar_trend: [],
    blood_pressure_trend: [],
    recovery_score_readmission_trend: [],
  };
}

export const ANALYTICS_CHART_KEYS = [
  "blood_sugar_trend",
  "blood_pressure_trend",
  "recovery_score_readmission_trend",
] as const;

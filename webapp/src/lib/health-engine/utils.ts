import type { ClinicalTrend, TimedValue, TrendDirection } from "./types";
import { DISCLAIMER } from "./constants";

export function latest(series?: TimedValue[] | null): number | null {
  if (!series?.length) return null;
  return series[series.length - 1]!.value;
}

export function seriesValues(series?: TimedValue[] | null): number[] {
  return (series ?? []).map((p) => p.value);
}

export function clamp(value: number, low = 0, high = 100): number {
  return Math.max(low, Math.min(high, value));
}

export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function trendDirection(
  values: number[],
  epsilon = 0,
): TrendDirection {
  if (values.length < 2) return "insufficient";
  const mid = Math.floor(values.length / 2);
  const first = mean(values.slice(0, Math.max(1, mid)));
  const second = mean(values.slice(mid));
  const delta = second - first;
  const threshold = epsilon > 0 ? epsilon : Math.max(0.5, Math.abs(first) * 0.03);
  if (delta > threshold) return "increasing";
  if (delta < -threshold) return "decreasing";
  return "stable";
}

/** Map raw series direction to Improving / Stable / Declining. */
export function toClinicalTrend(
  direction: TrendDirection,
  risingBad: boolean | null,
): ClinicalTrend {
  if (direction === "insufficient") return "insufficient";
  if (direction === "stable") return "stable";
  if (risingBad === null) {
    return direction === "increasing" ? "declining" : "improving";
  }
  if (direction === "increasing") {
    return risingBad ? "declining" : "improving";
  }
  return risingBad ? "improving" : "declining";
}

export function consecutiveRising(values: number[], minDays = 3): number {
  if (values.length < minDays) return 0;
  let streak = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i]! > values[i - 1]!) streak += 1;
    else streak = 0;
  }
  return streak;
}

export function scoreFromRange(
  value: number | null,
  opts: {
    idealLow: number;
    idealHigh: number;
    warnLow: number;
    warnHigh: number;
  },
): number {
  if (value == null) return 55;
  const { idealLow, idealHigh, warnLow, warnHigh } = opts;
  if (value >= idealLow && value <= idealHigh) return 95;
  if (value >= warnLow && value < idealLow) {
    const span = Math.max(idealLow - warnLow, 1e-6);
    return 70 + (25 * (value - warnLow)) / span;
  }
  if (value > idealHigh && value <= warnHigh) {
    const span = Math.max(warnHigh - idealHigh, 1e-6);
    return 95 - (25 * (value - idealHigh)) / span;
  }
  if (value < warnLow) return clamp(40 - (warnLow - value), 5, 40);
  return clamp(40 - (value - warnHigh), 5, 40);
}

export function inversePainScore(pain: number | null | undefined): number {
  if (pain == null) return 70;
  return clamp(100 - pain * 10);
}

export function pctOrDefault(
  value: number | null | undefined,
  fallback = 60,
): number {
  return value == null ? fallback : clamp(value);
}

export function meta(engine: string, impl: string) {
  return { engine, impl, disclaimer: DISCLAIMER };
}

export function cloneObservations<T extends object>(obs: T): T {
  return structuredClone(obs);
}

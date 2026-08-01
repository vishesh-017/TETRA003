import type {
  ContributingFactor,
  ExplanationResult,
  ReadmissionRiskResult,
  RecoveryScoreResult,
} from "./types";
import { meta } from "./utils";

/** Explainable AI — every result must explain WHY. */
export function explainPrediction(input: {
  recovery?: RecoveryScoreResult | null;
  readmission?: ReadmissionRiskResult | null;
  focus?: "readmission" | "recovery";
}): ExplanationResult {
  const bullets: string[] = [];
  const factors: ContributingFactor[] = [];
  const changes: string[] = [];
  const focus = input.focus ?? "readmission";

  if (input.readmission) {
    bullets.push(...input.readmission.explanation);
    factors.push(...input.readmission.contributing_factors);
    changes.push(
      `Readmission probability estimated at ${input.readmission.readmission_probability_percent.toFixed(0)}% (${input.readmission.risk_category}).`,
    );
  }

  if (input.recovery) {
    const neg = input.recovery.contributing_factors.filter(
      (f) => f.impact === "negative",
    );
    for (const f of neg.slice(0, 4)) {
      bullets.push(
        `${f.factor.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}: ${f.detail}`,
      );
    }
    factors.push(...neg);
    changes.push(
      `Recovery Score is ${input.recovery.recovery_score.toFixed(0)}/100 (${input.recovery.recovery_level}).`,
    );

    if (focus === "recovery" && neg.length) {
      bullets.unshift(
        ...neg.slice(0, 3).map((f) => {
          const name = f.factor.replaceAll("_", " ");
          if (name.includes("sugar")) return "Sugar increased or remained elevated";
          if (name.includes("blood_pressure") || name.includes("pressure"))
            return "BP remained uncontrolled";
          if (name.includes("medicine")) return "Medicines missed";
          if (name.includes("sleep")) return "Sleep reduced";
          return f.detail;
        }),
      );
    }
  }

  const seen = new Set<string>();
  const unique = bullets.filter((b) => {
    if (seen.has(b)) return false;
    seen.add(b);
    return true;
  });

  const elevated =
    input.readmission &&
    ["medium", "high", "critical"].includes(input.readmission.risk_category);

  const title =
    focus === "recovery"
      ? "Recovery Score changed because"
      : elevated
        ? "Readmission Risk increased because"
        : "Key drivers behind the current prediction";

  return {
    why: {
      title,
      bullets: unique.length
        ? unique
        : [
            "No major negative drivers detected in the current observation window.",
          ],
      factors: factors.slice(0, 8),
    },
    what_changed: changes,
    meta: meta("explainability", "factor_attribution_v1"),
  };
}

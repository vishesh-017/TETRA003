import type { RiskLevel } from "@/data/store/types";
import { buildLivePatientSnapshot } from "@/modules/ai-support/patient-snapshot";
import {
  SCREENING_RULES,
  matchInvestigation,
  normalizeConditions,
} from "@/modules/ai-support/screening-knowledge";
import type { ScreeningRecommendation } from "@/modules/ai-support/types";

export interface DiseaseRiskOutcome {
  key: string;
  label: string;
  score: number;
  band: RiskLevel;
}

export interface ClinicalOutcomesBundle {
  disease_risks: DiseaseRiskOutcome[];
  early_warnings: string[];
  missing_investigations: ScreeningRecommendation[];
  referral: {
    recommended: boolean;
    urgency: string;
    specialty: string;
    message: string;
    reasons: string[];
  };
}

function band(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "moderate";
  return "low";
}

/** Expected outcomes from live record (no circular import on checkup-engine). */
export function buildClinicalOutcomes(
  userOrPatientId: string,
): ClinicalOutcomesBundle {
  const snap = buildLivePatientSnapshot(userOrPatientId);
  const sugar = snap?.latest_checkin?.blood_sugar ?? null;
  const sys = snap?.latest_checkin?.bp_systolic ?? null;

  const diabetes =
    sugar == null ? 25 : sugar >= 250 ? 90 : sugar >= 180 ? 75 : sugar >= 140 ? 55 : 30;
  const hypertension =
    sys == null ? 25 : sys >= 180 ? 92 : sys >= 160 ? 78 : sys >= 140 ? 58 : 28;
  const ckd = Math.round(hypertension * 0.55 + diabetes * 0.45);
  const cardiovascular = Math.min(
    100,
    Math.round(hypertension * 0.7 + (sugar != null && sugar >= 180 ? 15 : 0)),
  );
  const stroke = Math.min(
    100,
    Math.round(
      hypertension * 0.65 + (snap?.age != null && snap.age >= 60 ? 15 : 5),
    ),
  );

  const disease_risks: DiseaseRiskOutcome[] = [
    { key: "diabetes", label: "Diabetes", score: diabetes, band: band(diabetes) },
    {
      key: "hypertension",
      label: "Hypertension",
      score: hypertension,
      band: band(hypertension),
    },
    { key: "ckd", label: "CKD", score: ckd, band: band(ckd) },
    {
      key: "cardiovascular",
      label: "Cardiovascular",
      score: cardiovascular,
      band: band(cardiovascular),
    },
    { key: "stroke", label: "Stroke", score: stroke, band: band(stroke) },
  ];

  const early_warnings: string[] = [];
  const overall = snap?.risk_level || "low";
  if (overall === "high" || overall === "critical") {
    early_warnings.push(
      `Overall live risk is ${overall} — clinician review recommended.`,
    );
  }
  for (const d of disease_risks) {
    if (d.band === "high" || d.band === "critical") {
      early_warnings.push(
        `Elevated ${d.label} risk (${d.score}/100) — watch for complications.`,
      );
    }
  }
  if (sugar != null && sugar < 70) {
    early_warnings.push("Recent low blood sugar on record — early hypo warning.");
  }
  if (sys != null && sys >= 180) {
    early_warnings.push("Recent very high BP — hypertensive emergency risk.");
  }

  const missing = recommendMissingInvestigations(userOrPatientId);
  const peak = Math.max(...disease_risks.map((d) => d.score), 0);
  const referral = {
    recommended: peak >= 70 || overall === "high" || overall === "critical",
    urgency:
      peak >= 85 || overall === "critical"
        ? "emergency"
        : peak >= 70
          ? "urgent"
          : peak >= 45
            ? "soon"
            : "routine",
    specialty:
      peak === stroke || peak === cardiovascular
        ? "Cardiology / Neurology"
        : peak === diabetes
          ? "Endocrinology / Internal medicine"
          : "Internal medicine",
    message:
      peak >= 70
        ? "Risk profile suggests specialty review soon — request an appointment."
        : "Continue monitoring with your care plan; escalate if symptoms worsen.",
    reasons: early_warnings.slice(0, 3),
  };

  return {
    disease_risks,
    early_warnings: [...new Set(early_warnings)].slice(0, 6),
    missing_investigations: missing,
    referral,
  };
}

export function recommendMissingInvestigations(
  userOrPatientId: string,
): ScreeningRecommendation[] {
  const snap = buildLivePatientSnapshot(userOrPatientId);
  if (!snap) return [];

  const conditions = normalizeConditions(snap.chronic_diseases);
  const existing = snap.investigations.map((i) => i.name);
  const sugar = snap.latest_checkin?.blood_sugar ?? null;
  const sys = snap.latest_checkin?.bp_systolic ?? null;
  const out: ScreeningRecommendation[] = [];

  for (const rule of SCREENING_RULES) {
    const already = existing.some((n) =>
      matchInvestigation(n, rule.name_matchers),
    );
    if (already) continue;
    const reason = rule.reason_for({
      age: snap.age,
      sugar,
      sys,
      conditions,
    });
    if (!reason) continue;
    const overlap = rule.conditions.some(
      (c) => c === "general" || conditions.includes(c),
    );
    if (!overlap && !reason) continue;
    out.push({
      test_name: rule.test_name,
      priority: rule.priority,
      reason,
      evidence_basis: rule.evidence_basis,
      already_ordered: false,
      already_completed: false,
    });
  }

  return out.slice(0, 5);
}

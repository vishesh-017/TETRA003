import { serializeSnapshotForAi } from "@/modules/ai-support/patient-snapshot";
import {
  buildClinicalOutcomes,
  type ClinicalOutcomesBundle,
  type DiseaseRiskOutcome,
} from "@/modules/ai-support/clinical-outcomes";
import { buildLivePatientSnapshot } from "@/modules/ai-support/patient-snapshot";
import type { ScreeningRecommendation } from "@/modules/ai-support/types";
import type { RiskLevel } from "@/data/store";
import {
  askEmergencyCheckup,
  isAiServiceConfigured,
} from "@/services/ai.service";

export interface EmergencyTriageResult {
  symptom_text: string;
  criticality: RiskLevel;
  criticality_score: number;
  is_emergency: boolean;
  title: string;
  summary: string;
  matched_red_flags: string[];
  next_actions: string[];
  when_to_call_108: string[];
  early_warnings: string[];
  disease_risks: DiseaseRiskOutcome[];
  missing_investigations: ScreeningRecommendation[];
  referral: ClinicalOutcomesBundle["referral"];
  context_note: string;
  disclaimer: string;
  provider: string;
}

const RED_FLAGS: Array<{ pattern: RegExp; label: string; weight: number }> = [
  {
    pattern:
      /chest\s*(pain|tight|pressure|discomfort)|heart\s*(ache|attack|pain)|angina|left\s*arm\s*pain/i,
    label: "Chest / heart pain pattern",
    weight: 45,
  },
  {
    pattern:
      /short(ness)?\s*of\s*breath|breathless|can'?t\s*breathe|difficulty\s*breathing|dyspn/i,
    label: "Breathing difficulty",
    weight: 40,
  },
  {
    pattern: /faint|passed\s*out|unconscious|collapse|syncope/i,
    label: "Fainting / collapse",
    weight: 42,
  },
  {
    pattern:
      /stroke|face\s*droop|slurred\s*speech|one\s*side\s*(weak|numb)|sudden\s*weakness/i,
    label: "Stroke-warning pattern",
    weight: 48,
  },
  {
    pattern:
      /shiver|trembl|tremor|hands?\s*shak|shaking|sweat|cold\s*sweat|hypogly/i,
    label: "Shivering / tremor / autonomic pattern",
    weight: 22,
  },
  {
    pattern:
      /sugar.*(low|high)|hypoglyc|hyperglyc|confused|confusion|drowsy/i,
    label: "Metabolic / confusion pattern",
    weight: 28,
  },
  {
    pattern: /bp\s*(high|very)|hypertensive|dizzy|dizziness|swelling/i,
    label: "BP / dizziness / swelling",
    weight: 18,
  },
  {
    pattern: /fever|cough|vomit|nausea|stomach|pain|ache|weak|fatigue/i,
    label: "General acute symptom",
    weight: 10,
  },
];

function band(score: number): RiskLevel {
  if (score >= 70) return "critical";
  if (score >= 50) return "high";
  if (score >= 30) return "moderate";
  return "low";
}

function localTriage(
  userOrPatientId: string,
  symptomText: string,
): EmergencyTriageResult {
  const text = symptomText.trim();
  const snap = buildLivePatientSnapshot(userOrPatientId);
  const outcomes = buildClinicalOutcomes(userOrPatientId);
  const matched: string[] = [];
  let score = 0;

  for (const rule of RED_FLAGS) {
    if (rule.pattern.test(text)) {
      matched.push(rule.label);
      score += rule.weight;
    }
  }

  if (snap) {
    if (snap.risk_level === "critical") score += 15;
    else if (snap.risk_level === "high") score += 10;
    const vitals = snap.latest_checkin;
    if (vitals?.bp_systolic && vitals.bp_systolic >= 180) score += 20;
    if (vitals?.oxygen != null && vitals.oxygen < 92) score += 25;
    if (vitals?.blood_sugar != null && vitals.blood_sugar < 70) score += 18;
    // Shivering + diabetes → raise metabolic concern
    if (
      /shiver|trembl|tremor|shak/i.test(text) &&
      snap.chronic_diseases.some((c) => /diabet/i.test(c))
    ) {
      score += 15;
      matched.push("Shivering with diabetes on record — consider low sugar");
    }
  }

  score = Math.min(100, Math.max(score, text ? 12 : 0));
  const criticality = band(score);
  const is_emergency = criticality === "critical" || criticality === "high";

  const next_actions =
    is_emergency
      ? [
          "Call 108 / go to the nearest emergency department now",
          "Do not drive yourself if chest pain, stroke signs, or faintness",
          "Alert your caregiver and doctor from the app after you are safe",
        ]
      : criticality === "moderate"
        ? [
            "Contact your doctor today — use Request appointment",
            "Log a check-in with current vitals and blood sugar",
            "Watch for worsening breathlessness, chest pain, or confusion",
          ]
        : [
            "Rest, hydrate, and complete a daily check-in",
            "If symptoms worsen suddenly, re-run this emergency checkup",
            "Keep taking medicines as prescribed by your doctor",
          ];

  return {
    symptom_text: text,
    criticality,
    criticality_score: score,
    is_emergency,
    title: is_emergency
      ? "This may be urgent — seek care now"
      : criticality === "moderate"
        ? "Needs prompt medical attention"
        : "Symptoms sound less urgent — still monitor",
    summary: `You reported: “${text}”. ${
      matched.length
        ? `Signals noted: ${matched.join("; ")}.`
        : "Assessed with your live clinical record."
    } Estimated criticality is ${criticality} (${score}/100).`,
    matched_red_flags: matched,
    next_actions,
    when_to_call_108: [
      "Chest pain, pressure, or pain into jaw/arm",
      "Severe breathlessness or blue lips",
      "Sudden face droop, speech trouble, or limb weakness",
      "Uncontrolled bleeding, seizure, or unconsciousness",
    ],
    early_warnings: outcomes.early_warnings,
    disease_risks: outcomes.disease_risks,
    missing_investigations: outcomes.missing_investigations,
    referral: outcomes.referral,
    context_note: snap
      ? `${snap.full_name} · risk ${snap.risk_level} · recovery ${snap.recovery_score}`
      : "Limited context",
    disclaimer:
      "HealNexus AI assists only. It does not diagnose or replace emergency services or your doctor.",
    provider: "local-rules",
  };
}

/** Prefer OpenRouter via ai-service; always attach live clinical outcomes. */
export async function runEmergencyTriageAsync(
  userOrPatientId: string,
  symptomText: string,
): Promise<EmergencyTriageResult> {
  const text = symptomText.trim();
  const base = localTriage(userOrPatientId, text);
  if (!text) return base;

  if (!isAiServiceConfigured()) {
    return { ...base, provider: "local-rules (set VITE_AI_API_BASE_URL)" };
  }

  try {
    const snap = buildLivePatientSnapshot(userOrPatientId);
    const api = await askEmergencyCheckup({
      symptoms: text,
      patient_context: snap
        ? serializeSnapshotForAi(snap)
        : base.context_note,
    });

    const crit = (api.criticality || base.criticality) as RiskLevel;
    const score = api.criticality_score ?? base.criticality_score;

    // Merge API disease hints with live scores (prefer higher of the two)
    const disease_risks = base.disease_risks.map((d) => {
      const fromApi = api.disease_risks?.find(
        (x) => x.key === d.key || x.label === d.label,
      );
      if (!fromApi) return d;
      const score = Math.max(d.score, fromApi.score);
      return {
        ...d,
        score,
        band: band(score),
      };
    });

    const early = [
      ...(api.early_warnings || []),
      ...base.early_warnings,
    ];
    const referral = {
      ...base.referral,
      ...(api.referral || {}),
      recommended:
        Boolean(api.referral?.recommended) || base.referral.recommended,
      specialty:
        (api.referral?.specialty as string) || base.referral.specialty,
      urgency: (api.referral?.urgency as string) || base.referral.urgency,
      message: (api.referral?.message as string) || base.referral.message,
      reasons: base.referral.reasons,
    };

    return {
      ...base,
      title: api.title || base.title,
      summary: api.summary || base.summary,
      criticality: crit,
      criticality_score: score,
      is_emergency:
        api.is_emergency ?? (crit === "high" || crit === "critical"),
      matched_red_flags: api.warning_signals?.length
        ? api.warning_signals
        : base.matched_red_flags,
      next_actions: api.next_actions?.length
        ? api.next_actions
        : base.next_actions,
      when_to_call_108: api.when_to_call_108?.length
        ? api.when_to_call_108
        : base.when_to_call_108,
      early_warnings: [...new Set(early)].slice(0, 8),
      disease_risks,
      referral,
      provider: api.provider || "openrouter",
      disclaimer: api.disclaimer || base.disclaimer,
    };
  } catch {
    return { ...base, provider: "local-rules (AI API unreachable)" };
  }
}

/** Sync helper for non-async callers */
export function runEmergencyTriage(
  userOrPatientId: string,
  symptomText: string,
): EmergencyTriageResult {
  return localTriage(userOrPatientId, symptomText);
}

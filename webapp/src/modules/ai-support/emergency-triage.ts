import { buildLivePatientSnapshot } from "@/modules/ai-support/patient-snapshot";
import type { RiskLevel } from "@/data/store";

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
  context_note: string;
  disclaimer: string;
}

const RED_FLAGS: Array<{
  pattern: RegExp;
  label: string;
  weight: number;
}> = [
  {
    pattern: /chest\s*(pain|tight|pressure|discomfort)|heart\s*(ache|attack|pain)|angina|left\s*arm\s*pain/i,
    label: "Chest / heart pain pattern",
    weight: 45,
  },
  {
    pattern: /short(ness)?\s*of\s*breath|breathless|can'?t\s*breathe|difficulty\s*breathing|dyspn/i,
    label: "Breathing difficulty",
    weight: 40,
  },
  {
    pattern: /faint|passed\s*out|unconscious|collapse|syncope/i,
    label: "Fainting / collapse",
    weight: 42,
  },
  {
    pattern: /stroke|face\s*droop|slurred\s*speech|one\s*side\s*(weak|numb)|sudden\s*weakness/i,
    label: "Stroke-warning pattern",
    weight: 48,
  },
  {
    pattern: /severe\s*(headache|bleed)|vomiting\s*blood|black\s*stool|seizure|convulsion/i,
    label: "Severe bleed / seizure / headache",
    weight: 40,
  },
  {
    pattern: /suicid|want\s*to\s*die|self\s*harm/i,
    label: "Self-harm concern",
    weight: 50,
  },
  {
    pattern: /sugar.*(low|high)|hypoglyc|hyperglyc|confused|confusion|drowsy/i,
    label: "Metabolic / confusion pattern",
    weight: 28,
  },
  {
    pattern: /bp\s*(high|very)|hypertensive|dizzy|dizziness|swelling\s*(feet|legs)/i,
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

/** Emergency-style AI checkup: patient describes sudden symptoms → criticality. */
export function runEmergencyTriage(
  userOrPatientId: string,
  symptomText: string,
): EmergencyTriageResult {
  const text = symptomText.trim();
  const snap = buildLivePatientSnapshot(userOrPatientId);
  const matched: string[] = [];
  let score = 0;

  for (const rule of RED_FLAGS) {
    if (rule.pattern.test(text)) {
      matched.push(rule.label);
      score += rule.weight;
    }
  }

  if (!text) {
    return {
      symptom_text: text,
      criticality: "low",
      criticality_score: 0,
      is_emergency: false,
      title: "Describe what you are feeling",
      summary:
        "Tell the AI what started suddenly (e.g. chest pain, breathlessness, dizziness). It will estimate criticality using your symptoms plus your live record.",
      matched_red_flags: [],
      next_actions: ["Type your symptoms above and tap Assess criticality"],
      when_to_call_108: [
        "Chest pain with sweating or breathlessness",
        "Sudden weakness, speech trouble, or collapse",
      ],
      context_note: snap
        ? `Record loaded for ${snap.full_name}`
        : "No patient record loaded",
      disclaimer:
        "Assistive only — not a diagnosis. If you think it is an emergency, call 108 now.",
    };
  }

  // Blend live risk / vitals into score
  if (snap) {
    if (snap.risk_level === "critical") score += 15;
    else if (snap.risk_level === "high") score += 10;
    const vitals = snap.latest_checkin;
    if (vitals?.bp_systolic && vitals.bp_systolic >= 180) {
      score += 20;
      matched.push("Recent BP in hypertensive emergency range");
    }
    if (vitals?.oxygen != null && vitals.oxygen < 92) {
      score += 25;
      matched.push("Recent low oxygen on record");
    }
    if (vitals?.blood_sugar != null && vitals.blood_sugar < 70) {
      score += 18;
      matched.push("Recent low blood sugar on record");
    }
  }

  score = Math.min(100, score);
  const criticality = band(score);
  const is_emergency = criticality === "critical" || criticality === "high";

  const next_actions: string[] = [];
  if (is_emergency) {
    next_actions.push("Call 108 / go to the nearest emergency department now");
    next_actions.push("Do not drive yourself if chest pain, stroke signs, or faintness");
    next_actions.push("Alert your caregiver and doctor from the app after you are safe");
  } else if (criticality === "moderate") {
    next_actions.push("Contact your doctor today — use Request appointment");
    next_actions.push("Log a check-in with current vitals");
    next_actions.push("Watch for worsening breathlessness, chest pain, or confusion");
  } else {
    next_actions.push("Rest, hydrate, and complete a daily check-in");
    next_actions.push("If symptoms worsen suddenly, re-run this emergency checkup");
    next_actions.push("Keep taking medicines as prescribed by your doctor");
  }

  const title = is_emergency
    ? "This may be urgent — seek care now"
    : criticality === "moderate"
      ? "Needs prompt medical attention"
      : "Symptoms sound less urgent — still monitor";

  const summary = matched.length
    ? `You reported: “${text}”. Matched signals: ${matched.join("; ")}. Estimated criticality is ${criticality} (${score}/100)${
        snap
          ? ` given your conditions (${snap.chronic_diseases.slice(0, 3).join(", ") || "on file"}) and latest vitals`
          : ""
      }.`
    : `You reported: “${text}”. No major emergency keyword matched strongly. Estimated criticality is ${criticality} (${score}/100). If you feel this is worse than the score, trust your symptoms and seek care.`;

  return {
    symptom_text: text,
    criticality,
    criticality_score: score,
    is_emergency,
    title,
    summary,
    matched_red_flags: matched,
    next_actions,
    when_to_call_108: [
      "Chest pain, pressure, or pain into jaw/arm",
      "Severe breathlessness or blue lips",
      "Sudden face droop, speech trouble, or limb weakness",
      "Uncontrolled bleeding, seizure, or unconsciousness",
    ],
    context_note: snap
      ? `${snap.full_name} · risk ${snap.risk_level} · recovery ${snap.recovery_score}`
      : "Limited context — sign in as patient for fuller triage",
    disclaimer:
      "HealNexus AI assists only. It does not diagnose or replace emergency services or your doctor.",
  };
}

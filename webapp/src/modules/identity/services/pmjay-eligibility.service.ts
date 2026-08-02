import { AHMEDABAD_DEMO_HOSPITALS } from "@/data/ahmedabad-hospitals";
import type {
  PmjayEligibilityResult,
  PmjayStatus,
  PmjayWizardAnswers,
} from "@/modules/identity/types";

const HELPLINE = "14555";

/**
 * Conversational PM-JAY eligibility — rule-based demo, not a live API.
 * Never asserts eligibility; uses "may be eligible" language.
 */
export function assessPmjayEligibility(
  answers: PmjayWizardAnswers,
): PmjayEligibilityResult {
  let score = 35;
  const reasons: string[] = [];

  if (answers.secc_listed === "yes") {
    score += 28;
    reasons.push("Household may appear on SECC / beneficiary lists");
  } else if (answers.secc_listed === "unsure") {
    score += 10;
    reasons.push("SECC listing needs verification at an empanelled hospital");
  }

  if (answers.has_ayushman_card === "yes") {
    score += 22;
    reasons.push("Ayushman card / eligible ID reported");
  } else if (answers.has_ayushman_card === "unsure") {
    score += 8;
  }

  const incomeNote = incomeRangeNote(answers.income_category);
  if (answers.income_category === "bpl" || answers.income_category === "low") {
    score += 15;
    reasons.push(incomeNote);
  } else if (answers.income_category === "middle") {
    score += 4;
    reasons.push(incomeNote);
  } else {
    score -= 8;
    reasons.push(incomeNote);
  }

  if (answers.rural === "yes") score += 6;
  if (answers.state === "Gujarat" || answers.state === "Rajasthan") score += 4;

  const confidence = Math.max(0.42, Math.min(0.92, score / 100 + 0.15));
  const status = toStatus(score);
  const hospital =
    AHMEDABAD_DEMO_HOSPITALS.find((h) => h.pmjay_empanelled) ??
    AHMEDABAD_DEMO_HOSPITALS[0]!;

  return {
    status,
    confidence: Number(confidence.toFixed(2)),
    headline: `${headlineFor(status)} ${incomeHeadline(answers.income_category)}`,
    benefits: [
      "Cashless treatment at empanelled hospitals (illustrative)",
      "Coverage for secondary and tertiary care packages (live summary)",
      "Family floater style benefits where applicable (verify locally)",
    ],
    documents: [
      "Aadhaar / government photo ID",
      "Ration card or income proof (as applicable)",
      "Ayushman card if already issued",
      "Recent prescription / discharge summary if seeking care",
    ],
    next_steps: [
      "Visit a nearby PM-JAY empanelled hospital with ID documents",
      "Ask the help desk to verify beneficiary status",
      "Call the national helpline for guidance before travel",
      ...reasons.map((r) => `Note: ${r}`),
    ],
    nearest_hospital: {
      name: hospital.name,
      address: hospital.address,
      phone: hospital.phone ?? "14555",
    },
    helpline: HELPLINE,
    disclaimer:
      "This is assistive guidance only — not an official eligibility determination. Always verify with PM-JAY / hospital help desk.",
  };
}

function toStatus(score: number): PmjayStatus {
  if (score >= 70) return "likely_eligible";
  if (score >= 45) return "needs_review";
  if (score >= 25) return "not_likely";
  return "unknown";
}

function headlineFor(status: PmjayStatus): string {
  switch (status) {
    case "likely_eligible":
      return "You may be eligible based on the information provided.";
    case "needs_review":
      return "You may need an in-person review to confirm possible benefits.";
    case "not_likely":
      return "Based on the information provided, PM-JAY benefits may be less likely — please verify locally.";
    default:
      return "More information is needed to estimate possible PM-JAY benefits.";
  }
}

/** Illustrative annual household income bands used only for assistive messaging. */
function incomeRangeNote(category: string): string {
  switch (category) {
    case "bpl":
      return "Income band: BPL / Antyodaya (illustrative under ₹1.5 lakh/year) — strongly aligns with typical PM-JAY targeting";
    case "low":
      return "Income band: Low (illustrative ₹1.5–3 lakh/year) — often considered for state / SECC-linked pathways";
    case "middle":
      return "Income band: Middle (illustrative ₹3–8 lakh/year) — may need SECC / state list verification; income alone is not enough";
    case "high":
      return "Income band: Higher (illustrative above ₹8 lakh/year) — PM-JAY is less likely unless already listed as a beneficiary";
    default:
      return "Income band not specified — verify locally";
  }
}

function incomeHeadline(category: string): string {
  switch (category) {
    case "bpl":
      return "(Your answers place the household in the BPL / under ₹1.5L band.)";
    case "low":
      return "(Your answers place the household in the low ₹1.5–3L band.)";
    case "middle":
      return "(Your answers place the household in the middle ₹3–8L band.)";
    case "high":
      return "(Your answers place the household in the higher >₹8L band.)";
    default:
      return "";
  }
}

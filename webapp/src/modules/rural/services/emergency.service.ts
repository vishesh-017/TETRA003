import type { RuralScreeningInput } from "@/modules/rural/types";

const CRITICAL_SYMPTOMS = new Set([
  "chest pain",
  "chest discomfort",
  "shortness of breath",
  "breathlessness",
  "unconscious",
  "fainting",
  "seizure",
  "severe bleeding",
  "confusion",
]);

export function evaluateEmergency(input: RuralScreeningInput): {
  isEmergency: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  if (input.bp_systolic != null && input.bp_systolic >= 180) {
    reasons.push(`Very high BP (systolic ${input.bp_systolic})`);
  }
  if (input.bp_diastolic != null && input.bp_diastolic >= 120) {
    reasons.push(`Very high BP (diastolic ${input.bp_diastolic})`);
  }
  if (input.blood_sugar != null && input.blood_sugar >= 300) {
    reasons.push(`Very high sugar (${input.blood_sugar})`);
  }
  if (input.blood_sugar != null && input.blood_sugar > 0 && input.blood_sugar <= 54) {
    reasons.push(`Critically low sugar (${input.blood_sugar})`);
  }
  if (input.oxygen != null && input.oxygen < 90) {
    reasons.push(`Low oxygen (${input.oxygen}%)`);
  }
  if (input.temperature != null && input.temperature >= 103) {
    reasons.push(`High fever (${input.temperature}°F)`);
  }
  if (input.pain_score != null && input.pain_score >= 8) {
    reasons.push(`Severe pain (${input.pain_score}/10)`);
  }

  for (const s of input.symptoms) {
    if (CRITICAL_SYMPTOMS.has(s.toLowerCase().trim())) {
      reasons.push(`Critical symptom: ${s}`);
    }
  }

  return { isEmergency: reasons.length > 0, reasons };
}

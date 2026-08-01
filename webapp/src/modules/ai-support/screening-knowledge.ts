/**
 * Evidence-informed screening knowledge (guideline-style rules).
 * These are clinical heuristics — not patient records. Recommendations are
 * applied only against the live patient snapshot at runtime.
 */

export type ConditionKey =
  | "diabetes"
  | "hypertension"
  | "heart_disease"
  | "ckd"
  | "general";

export interface ScreeningRule {
  id: string;
  test_name: string;
  conditions: ConditionKey[];
  /** Match open/completed investigation names (lowercase includes). */
  name_matchers: string[];
  priority: "routine" | "important" | "urgent";
  evidence_basis: string;
  reason_for: (ctx: {
    age: number | null;
    sugar: number | null;
    sys: number | null;
    conditions: ConditionKey[];
  }) => string | null;
}

export const SCREENING_RULES: ScreeningRule[] = [
  {
    id: "hba1c",
    test_name: "HbA1c",
    conditions: ["diabetes", "general"],
    name_matchers: ["hba1c", "a1c", "glycated"],
    priority: "important",
    evidence_basis: "ADA / ICMR — glycemic control monitoring",
    reason_for: ({ sugar, conditions }) => {
      if (conditions.includes("diabetes")) {
        return "Known diabetes — periodic HbA1c to track control.";
      }
      if (sugar != null && sugar >= 140) {
        return `Recent sugar ${sugar} mg/dL — confirm with HbA1c.`;
      }
      if ((conditions.includes("hypertension") || conditions.includes("ckd")) &&
        sugar == null) {
        return "Cardiometabolic risk without recent glucose lab — screen with HbA1c.";
      }
      return null;
    },
  },
  {
    id: "fbs",
    test_name: "Fasting Blood Sugar",
    conditions: ["diabetes", "general"],
    name_matchers: ["fasting", "fbs", "fbg", "glucose"],
    priority: "routine",
    evidence_basis: "WHO / ICMR diabetes screening",
    reason_for: ({ sugar, conditions }) => {
      if (conditions.includes("diabetes") && sugar == null) {
        return "Diabetes on record but no recent sugar reading — fasting glucose needed.";
      }
      return null;
    },
  },
  {
    id: "lipid",
    test_name: "Lipid Profile",
    conditions: ["diabetes", "hypertension", "heart_disease", "general"],
    name_matchers: ["lipid", "cholesterol", "ldl"],
    priority: "important",
    evidence_basis: "ASCVD risk stratification",
    reason_for: ({ age, conditions }) => {
      if (
        conditions.includes("diabetes") ||
        conditions.includes("heart_disease") ||
        conditions.includes("hypertension")
      ) {
        return "Lifestyle / CV risk conditions — lipid profile for ASCVD assessment.";
      }
      if (age != null && age >= 40) {
        return "Age ≥40 — opportunistic lipid screening.";
      }
      return null;
    },
  },
  {
    id: "rft",
    test_name: "Renal Function Test (Creatinine / eGFR)",
    conditions: ["ckd", "diabetes", "hypertension"],
    name_matchers: ["renal", "rft", "creatinine", "egfr", "kidney"],
    priority: "important",
    evidence_basis: "KDIGO / diabetes nephropathy screening",
    reason_for: ({ sys, conditions, sugar }) => {
      if (conditions.includes("ckd")) {
        return "CKD history — monitor creatinine / eGFR.";
      }
      if (conditions.includes("diabetes") || conditions.includes("hypertension")) {
        return "Diabetes/hypertension — screen for kidney involvement.";
      }
      if (sys != null && sys >= 160) {
        return `BP ${sys} mmHg — check renal function.`;
      }
      if (sugar != null && sugar >= 200) {
        return "Marked hyperglycemia — assess kidney function.";
      }
      return null;
    },
  },
  {
    id: "urine_acr",
    test_name: "Urine Albumin-Creatinine Ratio",
    conditions: ["diabetes", "ckd", "hypertension"],
    name_matchers: ["albumin", "acr", "microalbumin", "urine"],
    priority: "routine",
    evidence_basis: "KDIGO albuminuria screening",
    reason_for: ({ conditions }) => {
      if (
        conditions.includes("diabetes") ||
        conditions.includes("ckd") ||
        conditions.includes("hypertension")
      ) {
        return "Screen for albuminuria in diabetes / hypertension / CKD.";
      }
      return null;
    },
  },
  {
    id: "ecg",
    test_name: "ECG",
    conditions: ["heart_disease", "hypertension", "diabetes"],
    name_matchers: ["ecg", "ekg", "electrocardiogram"],
    priority: "important",
    evidence_basis: "CV risk / hypertension workup",
    reason_for: ({ sys, age, conditions }) => {
      if (conditions.includes("heart_disease")) {
        return "Heart disease history — baseline / follow-up ECG.";
      }
      if (sys != null && sys >= 160) {
        return `Elevated BP ${sys} mmHg — ECG recommended.`;
      }
      if (conditions.includes("hypertension") && age != null && age >= 50) {
        return "Long-standing hypertension risk — ECG screening.";
      }
      return null;
    },
  },
  {
    id: "eye",
    test_name: "Dilated Eye / Retinal Exam",
    conditions: ["diabetes"],
    name_matchers: ["retina", "fundus", "eye", "ophthal"],
    priority: "routine",
    evidence_basis: "ADA diabetic retinopathy screening",
    reason_for: ({ conditions }) =>
      conditions.includes("diabetes")
        ? "Diabetes — periodic retinal screening for retinopathy."
        : null,
  },
  {
    id: "thyroid",
    test_name: "TSH",
    conditions: ["general"],
    name_matchers: ["tsh", "thyroid"],
    priority: "routine",
    evidence_basis: "Common metabolic workup when symptoms suggest",
    reason_for: () => null, // only via symptoms in engine
  },
];

export function normalizeConditions(raw: string[]): ConditionKey[] {
  const out = new Set<ConditionKey>();
  for (const c of raw) {
    const lower = c.toLowerCase();
    if (lower.includes("diabet")) out.add("diabetes");
    else if (lower.includes("hyper") || lower.includes("blood pressure") || lower.includes("bp"))
      out.add("hypertension");
    else if (lower.includes("heart") || lower.includes("cardiac") || lower.includes("cad"))
      out.add("heart_disease");
    else if (lower.includes("ckd") || lower.includes("kidney") || lower.includes("renal"))
      out.add("ckd");
  }
  if (!out.size) out.add("general");
  return [...out];
}

export function matchInvestigation(
  investigationName: string,
  matchers: string[],
): boolean {
  const n = investigationName.toLowerCase();
  return matchers.some((m) => n.includes(m));
}

import type { InvestigationPriority } from "@/data/store";

export interface InvestigationTemplate {
  name: string;
  purpose: string;
  preparation: string;
  default_priority: InvestigationPriority;
  default_due_days: number;
}

/** Common post-discharge diagnostics — doctor can also add custom. */
export const INVESTIGATION_CATALOG: InvestigationTemplate[] = [
  {
    name: "Blood Sugar (FBS / PPBS)",
    purpose: "Monitor glucose control after discharge",
    preparation: "Fasting sugar: 8–10 hours fasting unless doctor advised otherwise.",
    default_priority: "important",
    default_due_days: 3,
  },
  {
    name: "HbA1c",
    purpose: "3-month average blood sugar control",
    preparation: "No special fasting usually required — follow lab advice.",
    default_priority: "important",
    default_due_days: 7,
  },
  {
    name: "CBC",
    purpose: "Complete blood count for infection / anemia monitoring",
    preparation: "Usually no fasting. Drink water unless restricted.",
    default_priority: "routine",
    default_due_days: 5,
  },
  {
    name: "Lipid Profile",
    purpose: "Cholesterol and lipid risk monitoring",
    preparation: "Typically 9–12 hours fasting. Confirm with the lab.",
    default_priority: "routine",
    default_due_days: 7,
  },
  {
    name: "Kidney Function Test",
    purpose: "Check kidney health (creatinine / urea)",
    preparation: "May need fasting — follow doctor/lab instructions.",
    default_priority: "important",
    default_due_days: 5,
  },
  {
    name: "ECG",
    purpose: "Heart rhythm check",
    preparation: "Wear loose clothing. Avoid oily skin creams on chest.",
    default_priority: "important",
    default_due_days: 3,
  },
  {
    name: "Chest X-Ray",
    purpose: "Lungs and chest imaging if advised",
    preparation: "Remove metal objects. Inform staff if pregnant.",
    default_priority: "important",
    default_due_days: 5,
  },
  {
    name: "Urine Test",
    purpose: "Urine analysis for infection / sugar / protein",
    preparation: "Collect mid-stream sample in a clean container if asked.",
    default_priority: "routine",
    default_due_days: 3,
  },
];

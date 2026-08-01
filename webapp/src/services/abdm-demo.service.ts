/** Mock ABHA import — structured demo records only. */

export interface MockAbhaRecord {
  abha_id: string;
  allergies: string[];
  prescriptions: Array<{ name: string; dose: string }>;
  medical_history: string[];
  is_demo: true;
  disclaimer: string;
}

export function getMockAbhaImport(abhaId = "12-3456-7890-1234"): MockAbhaRecord {
  return {
    abha_id: abhaId,
    allergies: ["Penicillin"],
    prescriptions: [{ name: "Metformin", dose: "500mg" }],
    medical_history: ["Type 2 Diabetes (demo)"],
    is_demo: true,
    disclaimer: "Mock ABHA import — not a real ABDM record.",
  };
}

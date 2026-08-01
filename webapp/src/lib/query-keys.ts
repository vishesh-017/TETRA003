export const queryKeys = {
  me: ["me"] as const,
  health: ["health"] as const,
  patients: {
    all: ["patients"] as const,
    detail: (id: string) => ["patients", id] as const,
  },
  notifications: ["notifications"] as const,
  recoveryScore: (patientId: string) => ["recovery-score", patientId] as const,
  lifestyleSimulator: (patientId: string) =>
    ["lifestyle-simulator", patientId] as const,
  analytics: (patientId: string) => ["analytics", patientId] as const,
  passport: (patientId: string) => ["passport", patientId] as const,
  hospitals: ["hospitals", "ahmedabad"] as const,
  pmjay: ["government", "pmjay"] as const,
  offline: ["offline", "records"] as const,
  documents: ["documents"] as const,
} as const;

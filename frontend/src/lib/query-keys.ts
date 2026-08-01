export const queryKeys = {
  me: ["me"] as const,
  health: ["health"] as const,
  patients: {
    all: ["patients"] as const,
    detail: (id: string) => ["patients", id] as const,
  },
  notifications: ["notifications"] as const,
} as const;

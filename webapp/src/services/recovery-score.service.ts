import type { RecoveryScore } from "@/types/domain";

/** Architecture contract for Recovery Score — calculation later. */
export function emptyRecoveryScore(patientId: string): RecoveryScore {
  return {
    patient_id: patientId,
    score: null,
    factors: {
      medicine_adherence: null,
      daily_checkins: null,
      symptom_severity: null,
      bp_trend: null,
      sugar_trend: null,
      activity_level: null,
      sleep: null,
    },
    model_version: "scaffold",
    status: "not_implemented",
  };
}

import { useMemo, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import {
  ZERO_ADJUSTMENTS,
  evaluateHealth,
  runLifestyleSimulation,
  type LifestyleAdjustments,
  type PatientObservationBundle,
} from "@/lib/health-engine";
import { buildObservationsFromLocal } from "@/modules/prediction/adapters";

export function useObservationBundle(userId?: string | null) {
  const { user } = useAuth();
  const id = userId ?? user?.id;
  return useMemo(
    () => (id ? buildObservationsFromLocal(id) : null),
    [id],
  );
}

/** Full in-app intelligence bundle — instant, no API. */
export function useHealthIntelligence(userId?: string | null) {
  const observations = useObservationBundle(userId);
  return useMemo(
    () => (observations ? evaluateHealth(observations) : null),
    [observations],
  );
}

export function useRecoveryScore(userId?: string | null) {
  const observations = useObservationBundle(userId);
  const intel = useMemo(
    () => (observations ? evaluateHealth(observations) : null),
    [observations],
  );
  return {
    data: intel?.recovery ?? null,
    observations,
  };
}

export function useRiskPrediction(userId?: string | null) {
  const intel = useHealthIntelligence(userId);
  return {
    readmission: intel?.readmission ?? null,
    progression: intel?.progression ?? null,
    alerts: intel?.alerts ?? null,
  };
}

export function useTrendAnalysis(userId?: string | null) {
  const intel = useHealthIntelligence(userId);
  return { data: intel?.trends ?? null };
}

/**
 * Lifestyle simulator — recalculates instantly on every slider change.
 * No network. No FastAPI.
 */
export function useLifestyleSimulation(
  observations?: PatientObservationBundle | null,
) {
  const local = useObservationBundle();
  const baseline = observations ?? local;
  const [adjustments, setAdjustments] =
    useState<LifestyleAdjustments>({ ...ZERO_ADJUSTMENTS });

  const result = useMemo(
    () =>
      baseline ? runLifestyleSimulation(baseline, adjustments) : null,
    [baseline, adjustments],
  );

  return {
    observations: baseline,
    adjustments,
    setAdjustments,
    result,
    /** Instant path — kept for API compatibility with older UI. */
    run: () => undefined,
    isPending: false,
    configured: Boolean(baseline),
  };
}

export function usePatientHealthById(patientUserId: string | null | undefined) {
  return useHealthIntelligence(patientUserId);
}

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { subscribeStore } from "@/data/store";
import {
  ZERO_ADJUSTMENTS,
  evaluateHealth,
  runLifestyleSimulation,
  type LifestyleAdjustments,
  type PatientObservationBundle,
} from "@/lib/health-engine";
import { buildObservationsFromLocal } from "@/modules/prediction/adapters";

/** Recompute when local store changes (check-ins, meds, scores). */
function useStoreTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeStore(() => setTick((t) => t + 1)), []);
  return tick;
}

export function useObservationBundle(userId?: string | null) {
  const { user } = useAuth();
  const id = userId ?? user?.id;
  const tick = useStoreTick();
  return useMemo(
    () => (id ? buildObservationsFromLocal(id) : null),
    // tick forces refresh after check-in / escalation writes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, tick],
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

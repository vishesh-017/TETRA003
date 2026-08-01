import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { subscribeStore } from "@/data/store";
import {
  evaluateHealth,
  runLifestyleSimulation,
  type PatientObservationBundle,
} from "@/lib/health-engine";
import { habitsToAdjustments } from "@/lib/health-engine/habits";
import {
  getLifestyleHabits,
  saveLifestyleHabits,
  type HabitControls,
} from "@/modules/patient/lifestyle-habits";
import {
  buildObservationsFromLocal,
  buildRawObservationsFromLocal,
} from "@/modules/prediction/adapters";
import { syncScoresFromEngine } from "@/modules/health-pipeline/process-checkin";
import { patientRepository } from "@/modules/patient/repository";

export type { HabitControls };

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
    // tick forces refresh after check-in / escalation / habit writes
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
 * Lifestyle simulator — recalculates instantly; persists habits so AI scores
 * update across Care Plan, Recovery, Escalation, and doctor Risk Panel.
 */
export function useLifestyleSimulation(
  observations?: PatientObservationBundle | null,
) {
  const { user } = useAuth();
  const tick = useStoreTick();
  const patientId = user
    ? patientRepository.resolvePatientId(user.id)
    : null;

  const rawBaseline = useMemo(() => {
    if (observations) return observations;
    if (!user?.id) return null;
    return buildRawObservationsFromLocal(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [observations, user?.id, tick]);

  const [habits, setHabitsState] = useState<HabitControls>(() =>
    patientId ? getLifestyleHabits(patientId) : { ...getLifestyleHabits("") },
  );

  useEffect(() => {
    if (!patientId) return;
    setHabitsState(getLifestyleHabits(patientId));
  }, [patientId, tick]);

  const result = useMemo(() => {
    if (!rawBaseline) return null;
    const adj = habitsToAdjustments(habits, rawBaseline);
    return runLifestyleSimulation(rawBaseline, adj);
  }, [rawBaseline, habits]);

  const setHabits = (next: HabitControls) => {
    setHabitsState(next);
    if (!patientId) return;
    saveLifestyleHabits(patientId, next);
    syncScoresFromEngine(patientId);
  };

  return {
    observations: rawBaseline,
    habits,
    setHabits,
    /** @deprecated use habits / setHabits */
    adjustments: habits,
    setAdjustments: setHabits,
    result,
    run: () => undefined,
    isPending: false,
    configured: Boolean(rawBaseline),
  };
}

export function usePatientHealthById(patientUserId: string | null | undefined) {
  return useHealthIntelligence(patientUserId);
}

import { getStore, updateStore, type LifestyleHabitRow } from "@/data/store";
import { DEFAULT_HABITS, habitsToAdjustments } from "@/lib/health-engine/habits";
import { applyAdjustments } from "@/lib/health-engine/simulator";
import type { PatientObservationBundle } from "@/lib/health-engine/types";

export type HabitControls = Omit<
  LifestyleHabitRow,
  "patient_id" | "updated_at"
>;

export function getLifestyleHabits(patientId: string): HabitControls {
  const row = getStore().lifestyleHabits.find((h) => h.patient_id === patientId);
  if (!row) return { ...DEFAULT_HABITS };
  return {
    exercise_minutes_week: row.exercise_minutes_week,
    sleep_hours: row.sleep_hours,
    weight_kg_delta: row.weight_kg_delta,
    salt_level: row.salt_level,
    sugar_control: row.sugar_control,
  };
}

export function saveLifestyleHabits(
  patientId: string,
  habits: Omit<LifestyleHabitRow, "patient_id" | "updated_at">,
): LifestyleHabitRow {
  const now = new Date().toISOString();
  let saved: LifestyleHabitRow = {
    patient_id: patientId,
    ...habits,
    updated_at: now,
  };
  updateStore((draft) => {
    const idx = draft.lifestyleHabits.findIndex(
      (h) => h.patient_id === patientId,
    );
    if (idx >= 0) {
      draft.lifestyleHabits[idx] = saved;
    } else {
      draft.lifestyleHabits.push(saved);
    }
  });
  return saved;
}

/** Apply persisted habits onto a baseline observation bundle. */
export function applyStoredHabits(
  patientId: string,
  baseline: PatientObservationBundle,
): PatientObservationBundle {
  const habits = getLifestyleHabits(patientId);
  const hasCustom = getStore().lifestyleHabits.some(
    (h) => h.patient_id === patientId,
  );
  if (!hasCustom) return baseline;
  return applyAdjustments(baseline, habitsToAdjustments(habits, baseline));
}

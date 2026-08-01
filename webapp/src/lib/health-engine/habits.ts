import type { LifestyleHabitRow } from "@/data/store/types";
import type {
  LifestyleAdjustments,
  PatientObservationBundle,
} from "./types";
import { latest } from "./utils";

export const DEFAULT_HABITS = {
  exercise_minutes_week: 60,
  sleep_hours: 6.5,
  weight_kg_delta: 0,
  salt_level: "medium" as const,
  sugar_control: "average" as const,
};

/** Map absolute habit UI state → engine deltas vs current observations. */
export function habitsToAdjustments(
  habits: Pick<
    LifestyleHabitRow,
    | "exercise_minutes_week"
    | "sleep_hours"
    | "weight_kg_delta"
    | "salt_level"
    | "sugar_control"
  >,
  baseline: PatientObservationBundle,
): LifestyleAdjustments {
  const currentExercise = latest(baseline.exercise_minutes) ?? 15;
  const currentSleep = latest(baseline.sleep_hours) ?? 6.5;
  const dailyExerciseTarget = habits.exercise_minutes_week / 7;

  const saltDelta =
    habits.salt_level === "low" ? -8 : habits.salt_level === "high" ? 10 : 0;
  const sugarDelta =
    habits.sugar_control === "good"
      ? 8
      : habits.sugar_control === "poor"
        ? -12
        : 0;

  return {
    exercise_minutes_delta: Number(
      (dailyExerciseTarget - currentExercise).toFixed(1),
    ),
    sleep_hours_delta: Number((habits.sleep_hours - currentSleep).toFixed(1)),
    water_intake_delta: 0,
    medicine_adherence_delta: sugarDelta > 0 ? 5 : sugarDelta < 0 ? -8 : 0,
    weight_kg_delta: habits.weight_kg_delta,
    salt_bp_delta: saltDelta,
    sugar_mg_delta:
      habits.sugar_control === "good"
        ? -18
        : habits.sugar_control === "poor"
          ? 22
          : 0,
  };
}

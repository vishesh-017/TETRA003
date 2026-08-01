import type {
  LifestyleSimulatorInputs,
  LifestyleSimulatorOutputs,
} from "@/types/domain";

export function projectLifestyleScaffold(
  _inputs: LifestyleSimulatorInputs,
): LifestyleSimulatorOutputs {
  return {
    recovery_score: null,
    readmission_risk: null,
    disease_progression: null,
  };
}

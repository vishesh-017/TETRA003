/**
 * HealNexus Health Intelligence Engine
 * Runs entirely in the React app — no FastAPI / prediction HTTP calls.
 *
 * Future ML: implement HealthModelProvider and call setHealthModelProvider().
 */

import { computeAlertDecision } from "./alerts";
import { computeDiseaseProgression } from "./disease";
import { explainPrediction } from "./explain";
import { computeRecoveryScore } from "./recovery";
import { computeReadmissionRisk } from "./risk";
import { simulateLifestyle } from "./simulator";
import { computeTrendAnalysis } from "./trends";
import type {
  AlertDecisionResult,
  DiseaseProgressionResult,
  ExplanationResult,
  HealthModelProvider,
  LifestyleAdjustments,
  LifestyleSimulationResult,
  PatientObservationBundle,
  ReadmissionRiskResult,
  RecoveryScoreResult,
  TrendAnalysisResult,
} from "./types";

export * from "./types";
export * from "./constants";
export {
  computeRecoveryScore,
  recoveryLevel,
} from "./recovery";
export { computeReadmissionRisk, riskCategory } from "./risk";
export { computeDiseaseProgression } from "./disease";
export { computeTrendAnalysis } from "./trends";
export { simulateLifestyle, applyAdjustments } from "./simulator";
export { computeAlertDecision } from "./alerts";
export { explainPrediction } from "./explain";
export {
  DEFAULT_ESCALATION_THRESHOLDS,
  getEscalationThresholds,
  resetEscalationThresholds,
  setEscalationThresholds,
  type EscalationThresholds,
} from "./thresholds";

let mlProvider: HealthModelProvider | null = null;

/** Swap rule-based engines for an on-device / WASM ML provider without touching UI. */
export function setHealthModelProvider(provider: HealthModelProvider | null) {
  mlProvider = provider;
}

export function getHealthModelProvider(): HealthModelProvider | null {
  return mlProvider;
}

export interface HealthIntelligenceBundle {
  recovery: RecoveryScoreResult;
  readmission: ReadmissionRiskResult;
  progression: DiseaseProgressionResult;
  trends: TrendAnalysisResult;
  alerts: AlertDecisionResult;
  explain: ExplanationResult;
}

/** Single entry-point used by hooks and Patient/Doctor modules. */
export function evaluateHealth(
  obs: PatientObservationBundle,
): HealthIntelligenceBundle {
  const recovery =
    mlProvider?.computeRecovery?.(obs) ?? computeRecoveryScore(obs);
  const readmission =
    mlProvider?.computeReadmission?.(obs, recovery.recovery_score) ??
    computeReadmissionRisk(obs, recovery.recovery_score);
  const progression = computeDiseaseProgression(obs);
  const trends = computeTrendAnalysis(obs);
  const alerts = computeAlertDecision(obs, {
    recovery_score: recovery.recovery_score,
    readmission_probability_percent:
      readmission.readmission_probability_percent,
    missed_checkin_days: obs.missed_checkin_days,
  });
  const explain = explainPrediction({
    recovery,
    readmission,
    focus: "readmission",
  });

  return { recovery, readmission, progression, trends, alerts, explain };
}

export function runLifestyleSimulation(
  baseline: PatientObservationBundle,
  adjustments: LifestyleAdjustments,
): LifestyleSimulationResult {
  return simulateLifestyle(baseline, adjustments);
}

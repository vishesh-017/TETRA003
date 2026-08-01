/**
 * Prediction module types — re-export Health Intelligence Engine contracts
 * so existing imports keep working. All scoring is in-app TypeScript.
 */
export type {
  AlertAction,
  AlertDecisionResult as AlertDecisionResponse,
  ClinicalTrend,
  Condition,
  ConditionProgression,
  ContributingFactor,
  DiseaseProgressionResult as DiseaseProgressionResponse,
  ExplanationResult as ExplanationResponse,
  LifestyleAdjustments,
  LifestyleSimulationResult as LifestyleSimulationResponse,
  PatientObservationBundle,
  ProgressRisk,
  ReadmissionRiskResult as ReadmissionRiskResponse,
  RecoveryLevel,
  RecoveryScoreResult as RecoveryScoreResponse,
  RiskCategory,
  ScenarioSnapshot,
  SymptomPoint,
  TimedValue,
  TrendAnalysisResult as TrendAnalysisResponse,
  TrendDirection,
  TrendItem,
} from "@/lib/health-engine";

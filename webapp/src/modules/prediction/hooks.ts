/**
 * Predictive dashboard hooks — powered by in-app Health Intelligence Engine.
 * No FastAPI / prediction HTTP required.
 */
export {
  useHealthIntelligence as usePredictiveDashboard,
  useLifestyleSimulation,
  useObservationBundle,
  useRecoveryScore,
  useRiskPrediction,
  useTrendAnalysis,
} from "@/hooks/health-engine";

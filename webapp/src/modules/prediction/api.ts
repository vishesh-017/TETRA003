import { aiRequest } from "@/api/client";
import { env } from "@/config/env";
import type {
  AlertDecisionResponse,
  DiseaseProgressionResponse,
  ExplanationResponse,
  LifestyleAdjustments,
  LifestyleSimulationResponse,
  PatientObservationBundle,
  ReadmissionRiskResponse,
  RecoveryScoreResponse,
  TrendAnalysisResponse,
} from "@/modules/prediction/types";

export function isPredictionEngineConfigured(): boolean {
  return Boolean(env.aiApiBaseUrl);
}

export const predictionApi = {
  recoveryScore: (body: PatientObservationBundle) =>
    aiRequest<RecoveryScoreResponse>("/predict/recovery-score", {
      method: "POST",
      body,
    }),

  readmission: (body: PatientObservationBundle & { recovery_score?: number }) =>
    aiRequest<ReadmissionRiskResponse>("/predict/readmission", {
      method: "POST",
      body,
    }),

  diseaseProgression: (body: PatientObservationBundle) =>
    aiRequest<DiseaseProgressionResponse>("/predict/disease-progression", {
      method: "POST",
      body,
    }),

  trends: (body: PatientObservationBundle) =>
    aiRequest<TrendAnalysisResponse>("/predict/trends", {
      method: "POST",
      body,
    }),

  lifestyleSimulation: (payload: {
    baseline: PatientObservationBundle;
    adjustments: LifestyleAdjustments;
  }) =>
    aiRequest<LifestyleSimulationResponse>("/predict/lifestyle-simulation", {
      method: "POST",
      body: payload,
    }),

  alerts: (
    body: PatientObservationBundle & {
      recovery_score?: number;
      readmission_probability_percent?: number;
    },
  ) =>
    aiRequest<AlertDecisionResponse>("/predict/alerts", {
      method: "POST",
      body,
    }),

  explain: (payload: {
    observations: PatientObservationBundle;
    focus?: string;
  }) =>
    aiRequest<ExplanationResponse>("/predict/explain", {
      method: "POST",
      body: payload,
    }),
};

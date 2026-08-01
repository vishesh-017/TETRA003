/** Health Intelligence Engine — shared TypeScript contracts (no network). */

export type RecoveryLevel =
  | "excellent"
  | "good"
  | "moderate"
  | "needs_attention"
  | "critical";

export type RiskCategory = "low" | "medium" | "high" | "critical";
export type ProgressRisk = "low" | "moderate" | "high" | "critical";

/** Raw series direction (math). */
export type TrendDirection =
  | "increasing"
  | "decreasing"
  | "stable"
  | "insufficient";

/** Clinical interpretation for UI (Improving / Stable / Declining). */
export type ClinicalTrend = "improving" | "stable" | "declining" | "insufficient";

export type AlertAction =
  | "no_action"
  | "monitor"
  | "doctor_review"
  | "immediate_attention"
  | "emergency";

export type Condition =
  | "diabetes"
  | "hypertension"
  | "heart_disease"
  | "ckd"
  | "other";

export interface TimedValue {
  recorded_at?: string | null;
  value: number;
}

export interface SymptomPoint {
  recorded_at?: string | null;
  symptoms: string[];
  pain_score?: number | null;
  severity?: number | null;
}

export interface PatientObservationBundle {
  patient_id?: string | null;
  patient_name?: string | null;
  age?: number | null;
  sex?: string | null;
  conditions?: Condition[];
  medicine_adherence_percent?: number | null;
  missed_medicine_doses_7d?: number;
  /** Consecutive calendar days without a check-in before today (0 if checked in today). */
  missed_checkin_days?: number;
  appointment_adherence_percent?: number | null;
  missed_appointments_30d?: number;
  checkin_completion_percent?: number | null;
  blood_pressure_systolic?: TimedValue[];
  blood_pressure_diastolic?: TimedValue[];
  blood_sugar?: TimedValue[];
  sleep_hours?: TimedValue[];
  water_intake_glasses?: TimedValue[];
  exercise_minutes?: TimedValue[];
  temperature_f?: TimedValue[];
  weight_kg?: TimedValue[];
  symptom_log?: SymptomPoint[];
  current_pain_score?: number | null;
  notes?: string | null;
}

export interface ContributingFactor {
  factor: string;
  impact: "positive" | "negative" | "neutral";
  weight: number;
  detail: string;
  evidence?: string | null;
}

export interface EngineMeta {
  engine: string;
  impl: string;
  disclaimer: string;
}

export interface RecoveryScoreResult {
  recovery_score: number;
  recovery_level: RecoveryLevel;
  contributing_factors: ContributingFactor[];
  factor_scores: Record<string, number>;
  summary: string;
  meta: EngineMeta;
}

export interface ReadmissionRiskResult {
  readmission_probability_percent: number;
  risk_category: RiskCategory;
  explanation: string[];
  contributing_factors: ContributingFactor[];
  summary: string;
  meta: EngineMeta;
}

export interface ConditionProgression {
  condition: string;
  risk: ProgressRisk;
  reason: string;
  confidence: number;
  recommendation: string;
}

export interface DiseaseProgressionResult {
  assessments: ConditionProgression[];
  overall_worsening_risk: ProgressRisk;
  summary: string;
  meta: EngineMeta;
}

export interface TrendItem {
  metric: string;
  direction: TrendDirection;
  clinical_trend: ClinicalTrend;
  label: string;
  natural_language: string;
  points: Array<{
    index: number;
    value: number;
    recorded_at?: string | null;
  }>;
}

export interface TrendAnalysisResult {
  trends: TrendItem[];
  narrative_summary: string;
  meta: EngineMeta;
}

export interface LifestyleAdjustments {
  exercise_minutes_delta: number;
  sleep_hours_delta: number;
  water_intake_delta: number;
  medicine_adherence_delta: number;
  weight_kg_delta: number;
}

export interface ScenarioSnapshot {
  recovery_score: number;
  recovery_level: RecoveryLevel;
  readmission_probability_percent: number;
  risk_category: RiskCategory;
  overall_worsening_risk: ProgressRisk;
}

export interface LifestyleSimulationResult {
  before: ScenarioSnapshot;
  after: ScenarioSnapshot;
  deltas: Record<string, number>;
  interpretation: string;
  chart_series: Array<{ metric: string; before: number; after: number }>;
  meta: EngineMeta;
}

export interface AlertDecisionResult {
  action: AlertAction;
  urgency: number;
  title: string;
  rationale: string[];
  clinician_message: string;
  patient_message: string;
  meta: EngineMeta;
}

export interface ExplanationResult {
  why: {
    title: string;
    bullets: string[];
    factors: ContributingFactor[];
  };
  what_changed: string[];
  meta: EngineMeta;
}

/** Future ML providers implement this protocol — swap only here. */
export interface HealthModelProvider {
  readonly name: string;
  computeRecovery?(obs: PatientObservationBundle): RecoveryScoreResult | null;
  computeReadmission?(
    obs: PatientObservationBundle,
    recoveryScore?: number,
  ): ReadmissionRiskResult | null;
}

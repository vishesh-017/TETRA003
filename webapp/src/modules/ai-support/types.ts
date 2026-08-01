import type { RiskLevel } from "@/data/store/types";

export type ScreeningPriority = "routine" | "important" | "urgent";

export interface ScreeningRecommendation {
  test_name: string;
  reason: string;
  priority: ScreeningPriority;
  evidence_basis: string;
  already_ordered: boolean;
  already_completed: boolean;
}

export interface DiseaseRiskScore {
  key: string;
  label: string;
  score: number;
  band: RiskLevel;
  drivers: string[];
}

export interface ReferralAdvice {
  recommended: boolean;
  urgency: "routine" | "soon" | "urgent" | "emergency";
  specialty: string;
  message: string;
  reasons: string[];
}

export interface AiCheckupResult {
  patient_id: string;
  patient_name: string;
  assessed_at: string;
  demographics: {
    age: number | null;
    sex: string | null;
    conditions: string[];
    diagnosis: string;
  };
  data_completeness: {
    has_vitals: boolean;
    has_medicines: boolean;
    has_labs: boolean;
    has_history: boolean;
    missing_fields: string[];
  };
  overall_risk: RiskLevel;
  recovery_score: number;
  readmission_probability_percent: number;
  disease_scores: DiseaseRiskScore[];
  warning_signs: string[];
  progression_signals: string[];
  missing_investigations: ScreeningRecommendation[];
  screening_recommendations: ScreeningRecommendation[];
  referral: ReferralAdvice;
  medicines_summary: string[];
  latest_vitals: {
    bp: string | null;
    sugar: string | null;
    weight: string | null;
    symptoms: string[];
    recorded_at: string | null;
  };
  summary: string;
  next_actions: string[];
  disclaimer: string;
}

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

import type { RiskLevel } from "@/modules/doctor/types";

export type RiskFilter = "all" | RiskLevel;

export interface EscalationPatientCard {
  id: string;
  full_name: string;
  primary_diagnosis: string;
  discharge_date: string | null;
  district: string;
  risk_level: RiskLevel;
  age?: number | null;
  conditions: string[];
}

export interface DiseaseScore {
  key: string;
  label: string;
  score: number;
}

export interface InvestigationOrderOption {
  id: string;
  name: string;
  ordered: boolean;
}

export interface ReferralSuggestion {
  recommended: boolean;
  specialty: string;
  message: string;
}

export interface PatientRiskData {
  patient_id: string;
  full_name: string;
  risk_level: RiskLevel;
  explanation: string;
  disease_scores: DiseaseScore[];
  red_flags: string[];
  investigation_options: InvestigationOrderOption[];
  referral: ReferralSuggestion;
  primary_diagnosis: string;
  discharge_date: string | null;
  district: string;
}

export interface ReferralPayload {
  patient_id: string;
  clinical_reason: string;
  urgency: "routine" | "urgent" | "emergency";
  specialty: string;
  notes: string;
}

export interface EscalationBundle {
  patients: EscalationPatientCard[];
  counts: Record<RiskFilter, number>;
}

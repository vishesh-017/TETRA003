import type { RiskLevel } from "@/modules/doctor/types";
import type { ProgressRisk, RecoveryLevel } from "@/lib/health-engine";

export type SuggestedAction =
  | "monitor"
  | "schedule_followup"
  | "immediate_review";

export type AlertCategory =
  | "emergency"
  | "high_risk"
  | "missed_medicine"
  | "missed_appointment"
  | "offline_sync"
  | "escalated";

export interface IntelligenceSummary {
  total_patients: number;
  active_followups: number;
  high_risk_patients: number;
  missed_checkins: number;
  appointments_today: number;
  emergency_alerts: number;
}

export interface PriorityPatientCard {
  patient_id: string;
  full_name: string;
  age: number | null;
  phone: string | null;
  abha_id: string | null;
  conditions: string[];
  recovery_score: number;
  recovery_level: RecoveryLevel;
  readmission_risk: RiskLevel;
  disease_progression: ProgressRisk;
  medicine_adherence: number;
  last_checkin_at: string | null;
  next_appointment_at: string | null;
  priority_score: number;
  risk_badge: RiskLevel;
  insight: string;
  suggested_action: SuggestedAction;
  health_worker: string | null;
  caregiver: string | null;
}

export interface AiInsightCard {
  id: string;
  patient_id: string;
  patient_name: string;
  summary: string;
  suggested_action: SuggestedAction;
  severity: RiskLevel;
  evidence: string[];
}

export interface IntelligenceAlert {
  id: string;
  category: AlertCategory;
  severity: RiskLevel;
  title: string;
  body: string;
  patient_id: string | null;
  patient_name: string | null;
  created_at: string;
  action_label: string;
  action_href: string;
}

export interface CohortTrendPoint {
  day: string;
  recovery_score: number;
  medicine_adherence: number;
  readmission_risk: number;
}

export interface IntelligenceFilters {
  search: string;
  risk: string;
  disease: string;
  age: string;
  recovery: string;
  appointment: string;
  health_worker: string;
  caregiver: string;
}

export interface AiPatientSummaryView {
  patient_id: string;
  current_condition: string;
  recovery_trend: string;
  medicine_adherence: string;
  latest_symptoms: string[];
  attention_level: SuggestedAction;
  narrative: string;
  disclaimer: string;
}

export interface IntelligenceBundle {
  summary: IntelligenceSummary;
  priority_queue: PriorityPatientCard[];
  insights: AiInsightCard[];
  alerts: IntelligenceAlert[];
  trends: CohortTrendPoint[];
  diseases: string[];
  health_workers: string[];
}

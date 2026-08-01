import type { RiskLevel } from "@/modules/doctor/types";

export type TrendDirection = "up" | "down" | "flat";
export type RecoveryGranularity = "daily" | "weekly" | "monthly";

export interface AnalyticsFilters {
  age: string;
  disease: string;
  doctor: string;
  risk: string;
}

export interface KpiMetric {
  id: string;
  label: string;
  value: number;
  unit: "count" | "percent" | "score";
  /** Absolute change vs previous week */
  delta: number;
  /** Percent change vs previous week */
  delta_pct: number;
  trend: TrendDirection;
  /** Short question this KPI answers */
  question: string;
  hint: string;
}

export interface TrendPoint {
  label: string;
  recovery_score: number;
  medicine_adherence: number;
  readmission_risk: number;
  followup_completion: number;
}

export interface DistributionBucket {
  key: string;
  label: string;
  value: number;
  pct: number;
}

export interface NamedCount {
  name: string;
  count: number;
}

export interface HighlightInsight {
  id: string;
  text: string;
  tone: "positive" | "neutral" | "attention";
}

export interface DoctorPerformanceRow {
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  hospital: string;
  patients_managed: number;
  average_recovery: number;
  followup_rate: number;
  patient_engagement: number;
}

export interface HospitalMapItem {
  id: string;
  name: string;
  address: string;
  phone: string;
  hospital_type: "government" | "pmjay" | "emergency" | "private";
  latitude: number;
  longitude: number;
  distance_km: number;
  services: string[];
  pmjay_empanelled: boolean;
  is_emergency: boolean;
}

export interface AttentionPatient {
  patient_id: string;
  full_name: string;
  risk: RiskLevel;
  recovery_score: number;
  reason: string;
}

export interface AiWeeklySummary {
  headline: string;
  bullets: string[];
  recommendations: string[];
  generated_at: string;
  disclaimer: string;
}

export type ReportKind =
  | "doctor"
  | "patient"
  | "hospital"
  | "weekly"
  | "monthly";

export interface ReportPayload {
  kind: ReportKind;
  title: string;
  generated_at: string;
  period_label: string;
  ai_summary: string;
  key_insights: string[];
  recommendations: string[];
  kpis: Array<{ label: string; value: string }>;
  tables: Array<{
    title: string;
    headers: string[];
    rows: string[][];
  }>;
}

export interface ExecutiveAnalyticsBundle {
  kpis: KpiMetric[];
  recovery_series: {
    daily: TrendPoint[];
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  };
  distributions: {
    recovery: DistributionBucket[];
    readmission: DistributionBucket[];
    progression: DistributionBucket[];
    adherence: DistributionBucket[];
    appointment: DistributionBucket[];
  };
  highlights: HighlightInsight[];
  hospital_insights: {
    top_diseases: NamedCount[];
    high_risk_patients: AttentionPatient[];
    recovery_trend: TrendPoint[];
    adherence_trend: TrendPoint[];
    readmission_trend: TrendPoint[];
  };
  doctor_performance: DoctorPerformanceRow[];
  hospitals: HospitalMapItem[];
  weekly_summary: AiWeeklySummary;
  filter_options: {
    diseases: string[];
    doctors: Array<{ id: string; name: string }>;
  };
  cohort_size: number;
}

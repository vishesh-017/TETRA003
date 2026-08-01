import type { UserRole } from "@/types";

export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type ProgressionBand = "improving" | "stable" | "watch" | "worsening";

export type HospitalType = "government" | "pmjay" | "emergency" | "private";

export interface RecoveryScoreFactors {
  medicine_adherence: number | null;
  daily_checkins: number | null;
  symptom_severity: number | null;
  bp_trend: number | null;
  sugar_trend: number | null;
  activity_level: number | null;
  sleep: number | null;
}

export interface RecoveryScore {
  patient_id: string;
  score: number | null;
  factors: RecoveryScoreFactors;
  model_version: string;
  status?: string;
}

export interface LifestyleSimulatorInputs {
  weight?: number;
  exercise?: string;
  sleep?: number;
  water_intake?: number;
  medication_adherence?: number;
}

export interface LifestyleSimulatorOutputs {
  recovery_score: number | null;
  readmission_risk: RiskLevel | null;
  disease_progression: ProgressionBand | null;
}

export interface AnalyticsCharts {
  blood_sugar_trend: Array<{ date: string; value: number }>;
  blood_pressure_trend: Array<{
    date: string;
    systolic: number;
    diastolic: number;
  }>;
  recovery_score_readmission_trend: Array<{
    date: string;
    recovery_score: number;
    readmission_risk: number;
  }>;
}

export interface PatientPassport {
  qr_token: string;
  abha_id_demo: string | null;
  medical_history: Record<string, unknown> | null;
  allergies: Record<string, unknown> | null;
  current_medicines: Record<string, unknown> | null;
  emergency_contacts: Record<string, unknown> | null;
}

export interface DemoHospital {
  id: string;
  name: string;
  hospital_type: HospitalType;
  latitude: number;
  longitude: number;
  address: string;
  city: "Ahmedabad";
  pmjay_empanelled: boolean;
  is_emergency: boolean;
  phone?: string;
  /** Demo services list for executive / map detail panels */
  services?: string[];
}

export type OfflineSyncState = "pending" | "syncing" | "synced" | "failed";

export interface OfflineRecord {
  id: string;
  entity_type: string;
  payload: Record<string, unknown>;
  sync_state: OfflineSyncState;
  captured_at: string;
  updated_at?: string;
  role?: UserRole;
  error?: string | null;
  client_version?: number;
}

export const AI_CARE_COMPANION_LABEL = "AI Care Companion" as const;

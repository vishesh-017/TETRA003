import type { OfflineSyncState } from "@/types/domain";

export type RuralLocale = "en" | "hi" | "gu";

export interface RuralScreeningInput {
  patient_id?: string | null;
  patient_name: string;
  phone?: string | null;
  village?: string | null;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  blood_sugar: number | null;
  temperature: number | null;
  weight: number | null;
  oxygen: number | null;
  symptoms: string[];
  medicine_taken: boolean | null;
  pain_score: number | null;
  notes: string | null;
}

export interface RuralScreeningRecord extends RuralScreeningInput {
  id: string;
  health_worker_id: string;
  captured_at: string;
  updated_at?: string;
  sync_state: OfflineSyncState;
  emergency: boolean;
  emergency_reasons: string[];
  client_version: number;
  error?: string | null;
}

export interface RuralNotification {
  id: string;
  title: string;
  body: string;
  kind: "sync" | "emergency" | "visit" | "tip" | "system";
  created_at: string;
  sync_state: OfflineSyncState;
  delivered_at: string | null;
  patient_id?: string | null;
}

export interface RuralDashboardStats {
  patients_assigned_today: number;
  home_visits_due: number;
  high_risk_patients: number;
  pending_sync: number;
  online: boolean;
}

export interface AssignedPatient {
  id: string;
  full_name: string;
  village: string | null;
  phone: string | null;
  risk_level: string | null;
  recovery_score: number | null;
  blood_group: string | null;
  conditions: string[];
}

export interface VisitView {
  id: string;
  patient_id: string;
  patient_name: string;
  scheduled_for: string;
  status: "due" | "completed" | "missed" | "upcoming";
  notes: string | null;
  village: string | null;
  completed_at: string | null;
}

export interface EducationCard {
  id: string;
  topic:
    | "medicine"
    | "diet"
    | "exercise"
    | "warning_signs"
    | "follow_up"
    | "emergency";
  title: string;
  body: string;
  bullets: string[];
}

export interface SyncSummary {
  synced: number;
  failed: number;
  pending: number;
  conflicts_resolved: number;
}

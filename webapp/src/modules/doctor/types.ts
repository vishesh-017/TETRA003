export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type ProgressionBand = "improving" | "stable" | "watch" | "worsening";
export type DischargeStatus = "draft" | "finalized";
export type CarePlanStatus =
  | "generating"
  | "ai_draft"
  | "doctor_approved"
  | "active"
  | "completed"
  | "rejected"
  | "superseded";
export type AppointmentStatus =
  | "scheduled"
  | "approved"
  | "completed"
  | "cancelled"
  | "missed";

export interface ContactInfo {
  name?: string;
  phone?: string;
  relationship?: string;
}

export interface PatientListItem {
  id: string;
  user_id: string;
  full_name: string;
  email?: string | null;
  phone?: string | null;
  age?: number | null;
  sex?: string | null;
  blood_group?: string | null;
  status: string;
  is_archived: boolean;
  recovery_score?: number | null;
  risk_level?: RiskLevel | null;
  abha_id_demo?: string | null;
  chronic_diseases?: string[] | null;
  created_at: string;
}

export interface PatientDetail extends PatientListItem {
  date_of_birth?: string | null;
  address?: Record<string, unknown> | null;
  allergies?: string[] | null;
  medical_history?: string | null;
  emergency_contact?: ContactInfo | null;
  caregiver_info?: ContactInfo | null;
  passport?: Record<string, unknown> | null;
  ai_summary?: string | null;
  disease_progression?: ProgressionBand | null;
  adherence_percent?: number | null;
  missed_checkins: number;
  missed_medicines: number;
}

export interface PatientFormValues {
  full_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  sex?: string;
  blood_group?: string;
  address_line?: string;
  city?: string;
  chronic_diseases?: string;
  allergies?: string;
  medical_history?: string;
  emergency_name?: string;
  emergency_phone?: string;
  emergency_relationship?: string;
  caregiver_name?: string;
  caregiver_phone?: string;
  caregiver_relationship?: string;
  abha_id_demo?: string;
}

export interface DashboardStats {
  total_patients: number;
  active_patients: number;
  high_risk_patients: number;
  followups_due_today: number;
  missed_followups: number;
  todays_appointments: number;
  medicine_adherence_percent: number;
  recent_alerts: AlertItem[];
}

export interface AlertItem {
  id: string;
  patient_id: string;
  patient_name?: string | null;
  alert_type: string;
  severity: RiskLevel;
  title: string;
  body?: string | null;
  status: string;
  created_at: string;
}

export interface HighRiskPatient {
  patient_id: string;
  full_name: string;
  recovery_score?: number | null;
  readmission_risk?: RiskLevel | null;
  disease_progression?: ProgressionBand | null;
  missed_medicines: number;
  missed_checkins: number;
  escalation_status: string;
  phone?: string | null;
}

export interface DischargeSummary {
  id: string;
  patient_id: string;
  doctor_id: string;
  source: "upload" | "manual";
  diagnosis_text?: string | null;
  medicines_text?: string | null;
  doctor_notes?: string | null;
  diet_advice?: string | null;
  exercise_advice?: string | null;
  restrictions?: string | null;
  special_instructions?: string | null;
  follow_up_date?: string | null;
  discharge_date?: string | null;
  hospital_name?: string | null;
  file_url?: string | null;
  status: DischargeStatus;
  finalized_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MedicineItem {
  id: string;
  care_plan_id: string;
  name: string;
  dose?: string | null;
  frequency?: string | null;
  route?: string | null;
  schedule?: Record<string, unknown> | null;
  instructions?: string | null;
}

export interface DailyTaskItem {
  id: string;
  care_plan_id: string;
  title: string;
  description?: string | null;
  cadence: string;
  priority: number;
  active: boolean;
}

export interface CarePlanScheduleItem {
  title: string;
  detail: string;
  category: string;
}

export interface CarePlanDailySchedule {
  morning: CarePlanScheduleItem[];
  afternoon: CarePlanScheduleItem[];
  evening: CarePlanScheduleItem[];
  night: CarePlanScheduleItem[];
}

export interface CarePlanSourceDischarge {
  diagnosis_text?: string | null;
  medicines_text?: string | null;
  doctor_notes?: string | null;
  diet_advice?: string | null;
  exercise_advice?: string | null;
  restrictions?: string | null;
  special_instructions?: string | null;
  follow_up_date?: string | null;
  hospital_name?: string | null;
}

export interface CarePlan {
  id: string;
  patient_id: string;
  doctor_id: string;
  discharge_id?: string | null;
  status: CarePlanStatus;
  version: number;
  caregiver_instructions?: string | null;
  patient_friendly_instructions?: string | null;
  warning_signs: string[];
  next_steps: string[];
  daily_schedule: CarePlanDailySchedule | null;
  followup_timeline?: Array<Record<string, unknown>> | null;
  doctor_review_notes?: string | null;
  ai_summary?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  updated_at?: string | null;
  source_discharge: CarePlanSourceDischarge | null;
  medicines: MedicineItem[];
  daily_tasks: DailyTaskItem[];
  disclaimer: string;
}

export interface AppointmentItem {
  id: string;
  patient_id: string;
  doctor_id: string;
  patient_name?: string | null;
  scheduled_at: string;
  location?: string | null;
  status: AppointmentStatus;
  appointment_type: string;
  notes?: string | null;
}

export interface CheckInItem {
  id: string;
  patient_id: string;
  recorded_at: string;
  pain_score?: number | null;
  symptoms?: Record<string, unknown> | null;
  vitals?: Record<string, unknown> | null;
  notes?: string | null;
}

export interface AiSummary {
  patient_id: string;
  summary: string;
  assistive: boolean;
  disclaimer: string;
}

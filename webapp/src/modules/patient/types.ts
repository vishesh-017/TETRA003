import type {
  AppointmentStatus,
  NotificationType,
  Period,
  RiskLevel,
  TaskStatus,
} from "@/data/store/types";

export type { Period, TaskStatus, RiskLevel, AppointmentStatus, NotificationType };

export interface TodayTask {
  id: string;
  title: string;
  description: string | null;
  period: Period;
  status: TaskStatus;
  sort_order: number;
}

export interface TodayDashboard {
  patient_id: string;
  full_name: string;
  greeting_name: string;
  progress_percent: number;
  recovery_score: number;
  risk_level: RiskLevel;
  tasks: TodayTask[];
  next_appointment: AppointmentView | null;
  days_until_appointment: number | null;
  unread_notifications: number;
}

export interface CarePlanTimeline {
  period: Period;
  label: string;
  tasks: TodayTask[];
}

export interface ActiveCarePlanView {
  id: string;
  version: number;
  patient_summary: string | null;
  caregiver_instructions: string | null;
  warning_signs: string[];
  next_steps: string[];
  follow_up_date: string | null;
}

export interface MedicineView {
  id: string;
  name: string;
  dose: string | null;
  frequency: string | null;
  time_slots: string[];
  instructions: string | null;
  today_status: TaskStatus | "late" | "none";
}

export interface AppointmentView {
  id: string;
  doctor_name: string;
  scheduled_at: string;
  location: string | null;
  status: AppointmentStatus;
  appointment_type: string;
  notes: string | null;
  days_left: number | null;
}

export interface PassportView {
  blood_group: string | null;
  allergies: string[];
  current_medicines: Array<{ name: string; dose?: string; time?: string }>;
  qr_token: string;
  abha_id_demo: string | null;
  emergency_contact: {
    name?: string;
    phone?: string;
    relationship?: string;
  } | null;
  medical_history: string | null;
}

export interface NotificationView {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface PatientProfileView {
  full_name: string;
  email: string | null;
  phone: string | null;
  username: string | null;
  passport_qr: string | null;
  address: Record<string, unknown> | null;
  preferred_language: string;
  emergency_contact: {
    name?: string;
    phone?: string;
    relationship?: string;
  } | null;
  blood_group: string | null;
  allergies: string[];
  chronic_diseases: string[];
  medical_history: string | null;
  notification_prefs: {
    medicine: boolean;
    appointment: boolean;
    tips: boolean;
    doctor_messages: boolean;
  };
}

export interface CheckInInput {
  bp_systolic?: number | null;
  bp_diastolic?: number | null;
  blood_sugar?: number | null;
  temperature?: number | null;
  weight?: number | null;
  oxygen?: number | null;
  symptoms?: string[];
  pain_score?: number | null;
  mood?: string | null;
  sleep_hours?: number | null;
  water_intake?: number | null;
  exercise?: string | null;
  medicine_taken?: boolean | null;
  notes?: string | null;
}

export interface RecoveryView {
  score: number;
  risk_level: RiskLevel;
  factors: {
    medicine_adherence: number;
    daily_checkins: number;
    task_completion: number;
    sleep: number;
  };
}

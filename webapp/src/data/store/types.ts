export type Role =
  | "doctor"
  | "patient"
  | "caregiver"
  | "health_worker"
  | "admin";
export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type TaskStatus = "pending" | "completed" | "skipped";
export type Period = "morning" | "afternoon" | "evening" | "night";
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
  | "missed"
  | "reschedule_requested"
  | "cancel_requested";
export type NotificationType =
  | "medicine"
  | "appointment"
  | "doctor_message"
  | "emergency"
  | "health_tip"
  | "investigation"
  | "referral";

export type InvestigationStatus =
  | "pending"
  | "scheduled"
  | "completed"
  | "overdue"
  | "cancelled"
  | "review_required";

export type InvestigationPriority = "routine" | "important" | "urgent";

export interface InvestigationRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  discharge_id: string | null;
  name: string;
  purpose: string | null;
  due_date: string;
  priority: InvestigationPriority;
  notes: string | null;
  status: InvestigationStatus;
  preparation: string | null;
  completed_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContactInfo {
  name?: string;
  phone?: string;
  relationship?: string;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  role: Role;
  locale: string;
  /** Unique handle for linking patients/doctors (scalable login identity). */
  username: string | null;
  /** Local demo auth password (admin-created accounts). Never use for production secrets. */
  password: string | null;
  address: Record<string, unknown> | null;
  notification_prefs: {
    medicine: boolean;
    appointment: boolean;
    tips: boolean;
    doctor_messages: boolean;
  };
}

export interface DoctorRow {
  id: string;
  user_id: string;
  specialty: string;
  hospital_affiliation: string;
}

export interface PatientRow {
  id: string;
  user_id: string;
  date_of_birth: string | null;
  sex: string | null;
  blood_group: string | null;
  abha_id_demo: string | null;
  address: Record<string, unknown> | null;
  chronic_diseases: string[];
  allergies: string[];
  medical_history: string | null;
  emergency_contact: ContactInfo | null;
  caregiver_info: ContactInfo | null;
  preferred_language: string;
  status: string;
  is_archived: boolean;
  created_at: string;
}

export interface PassportRow {
  patient_id: string;
  qr_token: string;
  abha_id_demo: string | null;
  allergies: string[];
  medical_history: string | null;
  emergency_contacts: ContactInfo | null;
  current_medicines: Array<{ name: string; dose?: string; time?: string }>;
  blood_group: string | null;
}

export interface CareRelationshipRow {
  doctor_id: string;
  patient_id: string;
  status: "active" | "ended";
}

export interface CaregiverPermissions {
  view_medicines: boolean;
  view_vitals: boolean;
  view_appointments: boolean;
  receive_alerts: boolean;
  emergency_access: boolean;
}

/** Patient ↔ caregiver link created when a patient invites family support. */
export interface CaregiverArrangementRow {
  id: string;
  patient_id: string;
  caregiver_user_id: string;
  caregiver_name: string;
  caregiver_phone: string;
  caregiver_email: string | null;
  relationship: string;
  permissions: CaregiverPermissions;
  status: "invited" | "active" | "revoked";
  invite_code: string;
  is_primary: boolean;
  created_at: string;
  accepted_at: string | null;
}

export interface RecoveryScoreRow {
  patient_id: string;
  score: number;
  computed_at: string;
}

export interface RiskRow {
  patient_id: string;
  score: number;
  level: RiskLevel;
  computed_at: string;
}

export interface CareTaskRow {
  id: string;
  patient_id: string;
  care_plan_id: string | null;
  title: string;
  description: string | null;
  period: Period;
  sort_order: number;
  active: boolean;
}

export interface TaskCompletionRow {
  id: string;
  patient_id: string;
  task_id: string;
  date: string; // YYYY-MM-DD
  status: TaskStatus;
  updated_at: string;
}

export interface MedicineRow {
  id: string;
  patient_id: string;
  care_plan_id: string | null;
  name: string;
  dose: string | null;
  frequency: string | null;
  time_slots: string[];
  instructions: string | null;
  active: boolean;
}

export interface MedicineEventRow {
  id: string;
  patient_id: string;
  medicine_id: string | null;
  status: "taken" | "late" | "skipped" | "missed";
  scheduled_for: string | null;
  acted_at: string;
  date: string;
}

export interface CheckInRow {
  id: string;
  patient_id: string;
  recorded_at: string;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  blood_sugar: number | null;
  temperature: number | null;
  weight: number | null;
  oxygen: number | null;
  symptoms: string[];
  pain_score: number | null;
  mood: string | null;
  sleep_hours: number | null;
  water_intake: number | null;
  exercise: string | null;
  medicine_taken: boolean | null;
  notes: string | null;
}

export interface AppointmentRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  scheduled_at: string;
  location: string | null;
  status: AppointmentStatus;
  appointment_type: string;
  notes: string | null;
}

export interface CarePlanSchedulePeriod {
  title: string;
  detail: string;
  category: string;
}

export interface CarePlanDailySchedule {
  morning: CarePlanSchedulePeriod[];
  afternoon: CarePlanSchedulePeriod[];
  evening: CarePlanSchedulePeriod[];
  night: CarePlanSchedulePeriod[];
}

export interface CarePlanRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  discharge_id: string | null;
  status: CarePlanStatus;
  version: number;
  caregiver_instructions: string | null;
  patient_friendly_instructions: string | null;
  ai_summary: string | null;
  warning_signs: string[];
  next_steps: string[];
  daily_schedule: CarePlanDailySchedule | null;
  doctor_review_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface DischargeRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  source: "upload" | "manual";
  diagnosis_text: string | null;
  medicines_text: string | null;
  doctor_notes: string | null;
  diet_advice: string | null;
  exercise_advice: string | null;
  restrictions: string | null;
  special_instructions: string | null;
  follow_up_date: string | null;
  discharge_date: string | null;
  hospital_name: string | null;
  file_url: string | null;
  status: "draft" | "finalized";
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertRow {
  id: string;
  patient_id: string;
  alert_type: string;
  severity: RiskLevel;
  title: string;
  body: string;
  /** Clinician-facing escalation reason (threshold / vitals / adherence). */
  reason: string;
  status: "open" | "acknowledged" | "resolved" | string;
  assigned_doctor_id: string | null;
  checkin_id: string | null;
  resolved_at: string | null;
  created_at: string;
}

export type HealthRecordCategory =
  | "prescription"
  | "lab_report"
  | "allergy"
  | "chronic_disease"
  | "vaccination"
  | "hospital_visit"
  | "doctor_note";

/** ABDM-compatible health record item (demo / future API). */
export interface HealthRecordRow {
  id: string;
  patient_id: string;
  category: HealthRecordCategory;
  title: string;
  summary: string;
  recorded_at: string;
  source: "abha_demo" | "local" | "manual";
  facility?: string | null;
  metadata?: Record<string, unknown>;
}

export type PmjayStatus =
  | "unknown"
  | "likely_eligible"
  | "needs_review"
  | "not_likely";

export interface GovernmentProfileRow {
  patient_id: string;
  abha_id: string | null;
  abha_linked: boolean;
  abha_linked_at: string | null;
  pmjay_status: PmjayStatus;
  pmjay_confidence: number;
  pmjay_answers: Record<string, string>;
  pmjay_assessed_at: string | null;
  linked_record_count: number;
}

export type HomeVisitStatus = "due" | "completed" | "missed" | "upcoming";

export interface HealthWorkerRow {
  id: string;
  user_id: string;
  area: string;
  phone: string | null;
}

export interface HealthWorkerAssignmentRow {
  health_worker_id: string;
  patient_id: string;
}

export interface HomeVisitRow {
  id: string;
  patient_id: string;
  health_worker_id: string;
  scheduled_for: string;
  status: HomeVisitStatus;
  completed_at: string | null;
  notes: string | null;
  village: string | null;
}

/** Persisted AI Checkup assessments (live snapshot results). */
export interface AiCheckupRow {
  id: string;
  patient_id: string;
  assessed_at: string;
  overall_risk: RiskLevel;
  recovery_score: number;
  readmission_probability_percent: number;
  summary: string;
  warning_signs: string[];
  missing_tests: string[];
  referral_specialty: string | null;
  payload: Record<string, unknown>;
}

/** Patient lifestyle habit targets — feed Health Engine + AI scores. */
export interface LifestyleHabitRow {
  patient_id: string;
  /** Weekly exercise target in minutes. */
  exercise_minutes_week: number;
  /** Typical nightly sleep hours. */
  sleep_hours: number;
  /** Planned weight change vs current (kg). Negative = loss. */
  weight_kg_delta: number;
  salt_level: "low" | "medium" | "high";
  sugar_control: "good" | "average" | "poor";
  updated_at: string;
}

/** Shared clinical reports (patient upload ↔ doctor feedback). */
export interface ClinicalReportRow {
  id: string;
  patient_id: string;
  doctor_id: string | null;
  title: string;
  report_type: string;
  notes: string | null;
  attachment_name: string | null;
  attachment_url: string | null;
  attachment_mime: string | null;
  doctor_feedback: string | null;
  feedback_at: string | null;
  status: "uploaded" | "reviewed" | "needs_attention";
  created_at: string;
  updated_at: string;
}

export interface HealNexusStore {
  version: number;
  profiles: ProfileRow[];
  doctors: DoctorRow[];
  patients: PatientRow[];
  passports: PassportRow[];
  relationships: CareRelationshipRow[];
  caregiverArrangements: CaregiverArrangementRow[];
  recoveryScores: RecoveryScoreRow[];
  risks: RiskRow[];
  carePlans: CarePlanRow[];
  careTasks: CareTaskRow[];
  taskCompletions: TaskCompletionRow[];
  medicines: MedicineRow[];
  medicineEvents: MedicineEventRow[];
  checkins: CheckInRow[];
  appointments: AppointmentRow[];
  notifications: NotificationRow[];
  discharges: DischargeRow[];
  investigations: InvestigationRow[];
  alerts: AlertRow[];
  healthRecords: HealthRecordRow[];
  clinicalReports: ClinicalReportRow[];
  lifestyleHabits: LifestyleHabitRow[];
  aiCheckups: AiCheckupRow[];
  governmentProfiles: GovernmentProfileRow[];
  healthWorkers: HealthWorkerRow[];
  healthWorkerAssignments: HealthWorkerAssignmentRow[];
  homeVisits: HomeVisitRow[];
}

export const STORE_VERSION = 18;
export const STORAGE_KEY = "healnexus-dynamic-store-v2";

export const IDS = {
  doctorUser: "00000000-0000-4000-8000-000000000001",
  doctor: "00000000-0000-4000-8000-000000000010",
  patientUser: "00000000-0000-4000-8000-000000000101",
  patient: "00000000-0000-4000-8000-000000000201",
  patient2User: "00000000-0000-4000-8000-000000000102",
  patient2: "00000000-0000-4000-8000-000000000202",
  patient3User: "00000000-0000-4000-8000-000000000103",
  patient3: "00000000-0000-4000-8000-000000000203",
  caregiverUser: "00000000-0000-4000-8000-000000000003",
  carePlan: "00000000-0000-4000-8000-000000000301",
  healthWorkerUser: "00000000-0000-4000-8000-000000000004",
  healthWorker: "00000000-0000-4000-8000-000000000040",
  adminUser: "00000000-0000-4000-8000-000000000099",
} as const;

export const DEFAULT_CAREGIVER_PERMISSIONS: CaregiverPermissions = {
  view_medicines: true,
  view_vitals: true,
  view_appointments: true,
  receive_alerts: true,
  emergency_access: true,
};

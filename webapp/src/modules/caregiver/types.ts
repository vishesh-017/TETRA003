export type CareStatus = "stable" | "needs_attention" | "critical";
export type AlertPriority = "critical" | "high" | "medium" | "low";
export type MedicineSlot = "morning" | "afternoon" | "evening" | "night";
export type MedicineState = "taken" | "skipped" | "missed" | "pending";
export type TimelineState = "done" | "pending" | "warning" | "upcoming";
export type TipCategory =
  | "today"
  | "diet"
  | "exercise"
  | "emergency"
  | "medicine";
export type TipLocale = "en" | "hi" | "gu";

export interface CareVitalChip {
  label: string;
  status: "ok" | "pending" | "alert";
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  shortLabel: string;
  age: number;
  avatarEmoji: string;
  recoveryScore: number;
  riskLevel: string;
  progression: string;
  status: CareStatus;
  statusLabel: string;
  todayProgress: number;
  vitals: CareVitalChip[];
  medicineAdherence: number;
  trend: "improving" | "stable" | "declining";
  trendLabel: string;
  nextAppointment: string;
  bloodGroup: string;
  allergies: string[];
  emergencyContact: { name: string; phone: string; relationship: string };
  doctorName: string;
  hospital: string;
  conditionSummary: string;
  pmjayStatus: string;
  abhaId: string;
}

export interface CareTimelineItem {
  id: string;
  time: string;
  title: string;
  detail: string;
  state: TimelineState;
}

export interface HealthInsight {
  id: string;
  title: string;
  why: string;
  tone: "positive" | "neutral" | "attention";
}

export interface DoctorMessage {
  id: string;
  doctorName: string;
  specialty: string;
  sentAt: string;
  paragraphs: string[];
}

export interface SmartAlert {
  id: string;
  priority: AlertPriority;
  title: string;
  detail: string;
  timeAgo: string;
  actionLabel?: string;
}

export interface MedicineDose {
  id: string;
  medicineId: string;
  timeSlot: string;
  name: string;
  dosage: string;
  instruction: string;
  slot: MedicineSlot;
  state: MedicineState;
  accent: string;
}

export interface CareAppointment {
  id: string;
  whenLabel: string;
  countdown: string;
  time: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  address: string;
  mapQuery: string;
}

export interface PassportPreviewData {
  name: string;
  bloodGroup: string;
  allergies: string[];
  medicines: string[];
  emergencyContact: string;
  emergencyPhone: string;
  qrValue: string;
  abhaId: string;
}

export interface AiCareInsight {
  summary: string;
  bullets: string[];
}

export interface EducationTip {
  id: string;
  category: TipCategory;
  categoryLabel: string;
  title: Record<TipLocale, string>;
  body: Record<TipLocale, string>;
}

export interface ActivityItem {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
  tone: "ok" | "info" | "alert";
}

export interface CaregiverCarePlanSupport {
  version: number;
  instructions: string[];
  warningSigns: string[];
  emergencyAdvice: string;
  medicineTimeline: string[];
  doctorNotes: string | null;
  upcomingAppointment: string | null;
  nextSteps: string[];
  patientSummary: string | null;
}

export interface CaregiverEmergencyContacts {
  doctorPhone: string;
  videoLink: string;
  emergencyPhone: string;
  hospitalName: string;
  hospitalPhone: string;
  ambulance: string;
}

export interface FamilyHealthSummary {
  memberCount: number;
  overallWellness: number;
  attentionCount: number;
  upcomingAppointments: number;
  criticalAlerts: number;
}

import type {
  ContactInfo,
  HealthRecordCategory,
  HealthRecordRow,
  PmjayStatus,
} from "@/data/store";

export interface DigitalPassport {
  patient_id: string;
  full_name: string;
  age: number | null;
  sex: string | null;
  blood_group: string | null;
  abha_id_demo: string | null;
  qr_token: string;
  photo_initials: string;
  conditions: string[];
  allergies: string[];
  medicines: Array<{ name: string; dose?: string; time?: string }>;
  doctor: {
    name: string;
    specialty: string;
    phone: string | null;
    hospital: string;
  } | null;
  hospital_name: string | null;
  emergency_contact: ContactInfo | null;
  recovery_score: number | null;
  readmission_risk: string | null;
  last_checkin_at: string | null;
  next_appointment_at: string | null;
  next_appointment_location: string | null;
  emergency_status: "stable" | "monitor" | "urgent";
  medical_history: string | null;
  address_city: string | null;
}

export interface EmergencyProfile {
  token: string;
  full_name: string;
  blood_group: string | null;
  allergies: string[];
  medicines: Array<{ name: string; dose?: string }>;
  emergency_contact: ContactInfo | null;
  doctor: {
    name: string;
    phone: string | null;
    hospital: string;
  } | null;
  disclaimer: string;
}

export interface TimelineEvent {
  id: string;
  kind:
    | "admission"
    | "discharge"
    | "medicine"
    | "checkin"
    | "appointment"
    | "report"
    | "vaccination"
    | "note";
  title: string;
  summary: string;
  at: string;
  meta?: string | null;
}

export interface BenefitsDashboard {
  abha_id: string | null;
  abha_linked: boolean;
  abha_linked_at: string | null;
  pmjay_status: PmjayStatus;
  pmjay_confidence: number;
  linked_record_count: number;
  schemes: Array<{ name: string; status: string; detail: string }>;
  documents: Array<{ name: string; required: boolean; ready: boolean }>;
  records_by_category: Record<HealthRecordCategory, number>;
}

export interface PmjayWizardAnswers {
  full_name: string;
  age: string;
  family_size: string;
  rural: string;
  income_category: string;
  state: string;
  secc_listed: string;
  has_ayushman_card: string;
}

export interface PmjayEligibilityResult {
  status: PmjayStatus;
  confidence: number;
  headline: string;
  benefits: string[];
  documents: string[];
  next_steps: string[];
  nearest_hospital: {
    name: string;
    address: string;
    phone: string;
  } | null;
  helpline: string;
  disclaimer: string;
}

export type { HealthRecordRow, HealthRecordCategory, PmjayStatus };

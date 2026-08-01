import type {
  InvestigationPriority,
  InvestigationStatus,
} from "@/data/store";

export type { InvestigationPriority, InvestigationStatus };

export interface InvestigationDraftInput {
  name: string;
  purpose?: string | null;
  due_date: string;
  priority?: InvestigationPriority;
  notes?: string | null;
  preparation?: string | null;
}

export interface InvestigationView {
  id: string;
  patient_id: string;
  patient_name?: string | null;
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
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_mime: string | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
  days_until_due: number;
}

export interface InvestigationComplianceStats {
  total: number;
  pending: number;
  scheduled: number;
  completed: number;
  overdue: number;
  review_required: number;
  compliance_rate: number;
}

export type InvestigationQueueFilter =
  | "all"
  | "pending"
  | "completed"
  | "overdue"
  | "high_priority"
  | "review_required";

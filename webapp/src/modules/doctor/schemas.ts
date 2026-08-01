import { z } from "zod";

export const linkPatientFormSchema = z.object({
  username_or_qr: z
    .string()
    .min(3, "Enter a username or passport QR token"),
});

export type LinkPatientFormSchema = z.infer<typeof linkPatientFormSchema>;

export const patientFormSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  sex: z.string().optional(),
  blood_group: z.string().optional(),
  address_line: z.string().optional(),
  city: z.string().optional(),
  chronic_diseases: z.string().optional(),
  allergies: z.string().optional(),
  medical_history: z.string().optional(),
  emergency_name: z.string().optional(),
  emergency_phone: z.string().optional(),
  emergency_relationship: z.string().optional(),
  caregiver_name: z.string().optional(),
  caregiver_phone: z.string().optional(),
  caregiver_relationship: z.string().optional(),
  abha_id_demo: z.string().optional(),
});

export type PatientFormSchema = z.infer<typeof patientFormSchema>;

export const dischargeFormSchema = z.object({
  diagnosis_text: z.string().min(2, "Diagnosis is required"),
  medicines_text: z.string().min(2, "Medicines are required"),
  doctor_notes: z.string().optional(),
  diet_advice: z.string().optional(),
  exercise_advice: z.string().optional(),
  restrictions: z.string().optional(),
  special_instructions: z.string().optional(),
  follow_up_date: z.string().optional(),
  discharge_date: z.string().optional(),
  hospital_name: z.string().optional(),
  file_url: z.string().optional(),
});

export type DischargeFormSchema = z.infer<typeof dischargeFormSchema>;

export const appointmentFormSchema = z.object({
  patient_id: z.string().uuid("Select a patient"),
  scheduled_at: z.string().min(1, "Schedule date/time is required"),
  location: z.string().optional(),
  notes: z.string().optional(),
  appointment_type: z.string().min(1),
});

export type AppointmentFormSchema = z.infer<typeof appointmentFormSchema>;

export function splitCsv(value?: string): string[] | undefined {
  if (!value?.trim()) return undefined;
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function toPatientPayload(values: PatientFormSchema) {
  return {
    full_name: values.full_name,
    email: values.email || undefined,
    phone: values.phone || undefined,
    date_of_birth: values.date_of_birth || undefined,
    sex: values.sex || undefined,
    blood_group: values.blood_group || undefined,
    address:
      values.address_line || values.city
        ? {
            line1: values.address_line || "",
            city: values.city || "Ahmedabad",
          }
        : undefined,
    chronic_diseases: splitCsv(values.chronic_diseases),
    allergies: splitCsv(values.allergies),
    medical_history: values.medical_history || undefined,
    emergency_contact:
      values.emergency_name || values.emergency_phone
        ? {
            name: values.emergency_name,
            phone: values.emergency_phone,
            relationship: values.emergency_relationship,
          }
        : undefined,
    caregiver_info:
      values.caregiver_name || values.caregiver_phone
        ? {
            name: values.caregiver_name,
            phone: values.caregiver_phone,
            relationship: values.caregiver_relationship,
          }
        : undefined,
    abha_id_demo: values.abha_id_demo || undefined,
  };
}

import { z } from "zod";

/** Empty inputs → null; reject out-of-range vitals with clear messages. */
function optionalVital(min: number, max: number, label: string) {
  return z.preprocess((val) => {
    if (val === "" || val === undefined || val === null) return null;
    const n = typeof val === "number" ? val : Number(val);
    return Number.isFinite(n) ? n : null;
  }, z.number().min(min, `${label} must be ≥ ${min}`).max(max, `${label} must be ≤ ${max}`).nullable());
}

export const checkInSchema = z.object({
  bp_systolic: optionalVital(70, 250, "Systolic BP"),
  bp_diastolic: optionalVital(40, 150, "Diastolic BP"),
  blood_sugar: optionalVital(40, 600, "Blood sugar"),
  temperature: optionalVital(90, 110, "Temperature"),
  weight: optionalVital(20, 300, "Weight"),
  oxygen: optionalVital(70, 100, "Oxygen"),
  symptoms: z.array(z.string()).optional().default([]),
  pain_score: optionalVital(0, 10, "Pain score"),
  mood: z.string().optional().nullable(),
  sleep_hours: optionalVital(0, 24, "Sleep hours"),
  water_intake: optionalVital(0, 20, "Water intake"),
  exercise: z.string().optional().nullable(),
  medicine_taken: z.boolean().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CheckInSchema = z.infer<typeof checkInSchema>;

export const profileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(32)
    .regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, . _ - only"),
  phone: z.string().min(8, "Enter a valid phone").max(20),
  address_line: z.string().optional(),
  city: z.string().optional(),
  preferred_language: z.string().min(2),
  emergency_name: z.string().min(2),
  emergency_phone: z.string().min(8),
  emergency_relationship: z.string().min(2),
  notify_medicine: z.boolean(),
  notify_appointment: z.boolean(),
  notify_tips: z.boolean(),
  notify_doctor: z.boolean(),
});

export type ProfileSchema = z.infer<typeof profileSchema>;

import { z } from "zod";

export const checkInSchema = z.object({
  bp_systolic: z.coerce.number().min(70).max(250).optional().nullable(),
  bp_diastolic: z.coerce.number().min(40).max(150).optional().nullable(),
  blood_sugar: z.coerce.number().min(40).max(600).optional().nullable(),
  temperature: z.coerce.number().min(90).max(110).optional().nullable(),
  weight: z.coerce.number().min(20).max(300).optional().nullable(),
  oxygen: z.coerce.number().min(70).max(100).optional().nullable(),
  symptoms: z.array(z.string()).optional().default([]),
  pain_score: z.coerce.number().min(0).max(10).optional().nullable(),
  mood: z.string().optional().nullable(),
  sleep_hours: z.coerce.number().min(0).max(24).optional().nullable(),
  water_intake: z.coerce.number().min(0).max(20).optional().nullable(),
  exercise: z.string().optional().nullable(),
  medicine_taken: z.boolean().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type CheckInSchema = z.infer<typeof checkInSchema>;

export const profileSchema = z.object({
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

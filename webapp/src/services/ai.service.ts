/**
 * Frontend client for the HealNexus AI Intelligence Platform (ai-service).
 * Secrets stay on the server — never call Exa from the browser.
 */

import { aiRequest, ApiError } from "@/api/client";
import { env } from "@/config/env";

const DISCLAIMER =
  "AI Care Companion assists only. It never diagnoses, never prescribes, and never replaces your doctor.";

export interface AiChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AiAssistantResult {
  summary: string;
  key_points: string[];
  when_to_contact_doctor: string[];
  disclaimer: string;
  provider: string;
}

export interface CareCompanionScheduleItem {
  title: string;
  detail: string;
  category: string;
}

export interface CareCompanionResult {
  daily_schedule: {
    morning: CareCompanionScheduleItem[];
    afternoon: CareCompanionScheduleItem[];
    evening: CareCompanionScheduleItem[];
    night: CareCompanionScheduleItem[];
  };
  patient_friendly_explanation: string;
  caregiver_instructions: string;
  warning_signs: string[];
  next_steps: string[];
  organized_medicines?: Array<{
    name: string;
    dose?: string | null;
    frequency?: string | null;
    instructions?: string | null;
  }>;
  meta: { provider: string; disclaimer: string; model_hint?: string };
}

export function isAiServiceConfigured(): boolean {
  return Boolean(env.aiApiBaseUrl);
}

export async function askHealthAssistant(
  messages: AiChatMessage[],
): Promise<AiAssistantResult> {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last?.content) {
    return {
      summary: "Ask a recovery or lifestyle education question to begin.",
      key_points: [],
      when_to_contact_doctor: [],
      disclaimer: DISCLAIMER,
      provider: "none",
    };
  }

  if (!isAiServiceConfigured()) {
    return {
      summary:
        "AI service is not configured. Set VITE_AI_API_BASE_URL to your ai-service (e.g. http://127.0.0.1:8001).",
      key_points: [
        "Follow your approved care plan",
        "Contact your doctor for clinical decisions",
      ],
      when_to_contact_doctor: [
        "Chest pain, severe breathlessness, confusion, or fainting",
      ],
      disclaimer: DISCLAIMER,
      provider: "stub",
    };
  }

  try {
    const data = await aiRequest<{
      summary: string;
      key_points: string[];
      when_to_contact_doctor: string[];
      disclaimer: string;
      meta: { provider: string };
    }>("/ai/health-assistant", {
      method: "POST",
      body: { question: last.content, locale: "en" },
    });
    return {
      summary: data.summary,
      key_points: data.key_points,
      when_to_contact_doctor: data.when_to_contact_doctor,
      disclaimer: data.disclaimer || DISCLAIMER,
      provider: data.meta?.provider || "ai-service",
    };
  } catch (err) {
    const detail =
      err instanceof ApiError
        ? err.message
        : "AI service unavailable. Try again later.";
    return {
      summary: detail,
      key_points: ["Use your care plan meanwhile", "Contact your clinician if urgent"],
      when_to_contact_doctor: [
        "Chest pain, severe breathlessness, confusion, or fainting",
      ],
      disclaimer: DISCLAIMER,
      provider: "error",
    };
  }
}

export async function organizeCareCompanion(input: {
  diagnosis?: string;
  medicines?: string;
  doctor_notes?: string;
  diet_advice?: string;
  exercise_advice?: string;
  restrictions?: string;
  special_instructions?: string;
  follow_up_date?: string;
  hospital_name?: string;
  patient_name?: string;
  /** Prescribed investigations — organize reminders only; never interpret results. */
  investigations?: string;
}): Promise<CareCompanionResult> {
  const { organizeCareCompanionLocal } = await import(
    "@/services/care-companion-local"
  );

  if (!isAiServiceConfigured()) {
    return organizeCareCompanionLocal(input);
  }

  try {
    const data = await aiRequest<CareCompanionResult>("/ai/care-companion", {
      method: "POST",
      body: { ...input, locale: "en" },
    });
    return {
      ...data,
      organized_medicines: data.organized_medicines ?? [],
      meta: {
        provider: data.meta?.provider || "ai-service",
        disclaimer: data.meta?.disclaimer || DISCLAIMER,
        model_hint: data.meta?.model_hint,
      },
    };
  } catch {
    return organizeCareCompanionLocal(input);
  }
}

export async function fetchPatientSummary(payload: Record<string, unknown>) {
  if (!isAiServiceConfigured()) return null;
  return aiRequest("/ai/patient-summary", { method: "POST", body: payload });
}

export async function fetchEducation(payload: {
  topic: string;
  locale?: string;
  condition_context?: string;
}) {
  if (!isAiServiceConfigured()) return null;
  return aiRequest("/ai/education", { method: "POST", body: payload });
}

export async function fetchGovernmentGuidance(payload: {
  topic?: string;
  question?: string;
  city_hint?: string;
}) {
  if (!isAiServiceConfigured()) return null;
  return aiRequest("/ai/government-guidance", {
    method: "POST",
    body: payload,
  });
}

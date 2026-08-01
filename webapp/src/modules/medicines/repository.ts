import {
  getStore,
  newId,
  updateStore,
  type MedicineRow,
} from "@/data/store";
import { syncScoresFromEngine } from "@/modules/health-pipeline/process-checkin";

export const MEAL_SLOTS = ["Morning", "Lunch", "Dinner", "Night"] as const;
export type MealSlot = (typeof MEAL_SLOTS)[number];

export type MedicineDraft = {
  name: string;
  dose: string;
  frequency: string;
  time_slots: string[];
  instructions: string;
  active: boolean;
};

export function listMedicinesForPatient(patientId: string): MedicineRow[] {
  return getStore()
    .medicines.filter((m) => m.patient_id === patientId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function upsertMedicine(
  patientId: string,
  input: MedicineDraft & { id?: string },
  actor: "doctor" | "patient",
): MedicineRow {
  const now = new Date().toISOString();
  const name = input.name.trim();
  if (!name) throw new Error("Medicine name is required");

  let saved: MedicineRow | null = null;
  updateStore((draft) => {
    if (input.id) {
      const row = draft.medicines.find((m) => m.id === input.id);
      if (!row || row.patient_id !== patientId) {
        throw new Error("Medicine not found");
      }
      row.name = name;
      row.dose = input.dose.trim() || null;
      row.time_slots = normalizeSlots(input.time_slots);
      row.frequency = frequencyFromSlots(row.time_slots);
      row.instructions =
        [
          input.instructions.trim(),
          actor === "patient" ? "(Updated by patient)" : null,
        ]
          .filter(Boolean)
          .join(" ") || null;
      row.active = input.active;
      saved = { ...row };
    } else {
      const slots = normalizeSlots(input.time_slots);
      const row: MedicineRow = {
        id: newId(),
        patient_id: patientId,
        care_plan_id: null,
        name,
        dose: input.dose.trim() || null,
        frequency: frequencyFromSlots(slots),
        time_slots: slots,
        instructions: input.instructions.trim() || null,
        active: input.active,
      };
      draft.medicines.unshift(row);
      saved = row;
    }

    const passport = draft.passports.find((p) => p.patient_id === patientId);
    if (passport) {
      passport.current_medicines = draft.medicines
        .filter((m) => m.patient_id === patientId && m.active)
        .map((m) => ({
          name: m.name,
          dose: m.dose || undefined,
          time: m.time_slots.join(", ") || undefined,
        }));
    }

    draft.notifications.unshift({
      id: newId(),
      user_id:
        draft.patients.find((p) => p.id === patientId)?.user_id || patientId,
      type: "medicine",
      title: actor === "doctor" ? "Medicine schedule updated" : "Medicine updated",
      body: `${name} · ${normalizeSlots(input.time_slots).join(", ") || "As directed"}`,
      read: false,
      created_at: now,
    });
  });

  syncScoresFromEngine(patientId);
  return saved!;
}

export function removeMedicine(patientId: string, medicineId: string) {
  updateStore((draft) => {
    const row = draft.medicines.find(
      (m) => m.id === medicineId && m.patient_id === patientId,
    );
    if (row) row.active = false;
    const passport = draft.passports.find((p) => p.patient_id === patientId);
    if (passport) {
      passport.current_medicines = draft.medicines
        .filter((m) => m.patient_id === patientId && m.active)
        .map((m) => ({
          name: m.name,
          dose: m.dose || undefined,
          time: m.time_slots.join(", ") || undefined,
        }));
    }
  });
  syncScoresFromEngine(patientId);
}

export function normalizeSlots(slots: string[]): string[] {
  const allowed = new Set<string>(MEAL_SLOTS as unknown as string[]);
  const mapped = slots.map((s) => {
    const lower = s.toLowerCase();
    if (lower.includes("morning") || s.startsWith("08") || s.startsWith("07"))
      return "Morning";
    if (
      lower.includes("lunch") ||
      lower.includes("afternoon") ||
      s.startsWith("13") ||
      s.startsWith("12") ||
      s.startsWith("14")
    )
      return "Lunch";
    if (
      lower.includes("dinner") ||
      lower.includes("evening") ||
      s.startsWith("19") ||
      s.startsWith("20")
    )
      return "Dinner";
    if (lower.includes("night") || s.startsWith("21") || s.startsWith("22"))
      return "Night";
    if (allowed.has(s)) return s;
    return s;
  });
  return [...new Set(mapped.filter((s) => allowed.has(s)))];
}

/** Map “times per day” (1–4) → meal slots. */
export function slotsForTimesPerDay(times: number): string[] {
  const n = Math.min(4, Math.max(1, Math.round(times)));
  if (n === 1) return ["Morning"];
  if (n === 2) return ["Morning", "Night"];
  if (n === 3) return ["Morning", "Lunch", "Dinner"];
  return ["Morning", "Lunch", "Dinner", "Night"];
}

export function frequencyFromSlots(slots: string[]): string {
  const n = normalizeSlots(slots).length;
  if (n <= 0) return "As directed";
  if (n === 1) return "Once daily";
  if (n === 2) return "Twice daily";
  if (n === 3) return "Three times daily";
  return "Four times daily";
}

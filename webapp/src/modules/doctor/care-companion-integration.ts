import type { CareCompanionResult } from "@/services/ai.service";
import type { CarePlanDailySchedule, Period } from "@/data/store";

export function timeSlotsFromFrequency(frequency?: string | null): string[] {
  const f = (frequency || "").toLowerCase();
  if (f.includes("thrice") || f.includes("three") || f.includes("tid")) {
    return ["08:00", "14:00", "20:00"];
  }
  if (f.includes("twice") || f.includes("bid") || /\b2\b/.test(f)) {
    return ["08:00", "20:00"];
  }
  if (f.includes("night") || f.includes("bed") || f.includes("hs")) {
    return ["21:00"];
  }
  if (f.includes("afternoon")) return ["14:00"];
  if (f.includes("evening")) return ["20:00"];
  return ["08:00"];
}

export function scheduleToTaskRows(
  schedule: CareCompanionResult["daily_schedule"],
): Array<{ title: string; description: string; period: Period; sort_order: number }> {
  const periods: Period[] = ["morning", "afternoon", "evening", "night"];
  const rows: Array<{
    title: string;
    description: string;
    period: Period;
    sort_order: number;
  }> = [];
  for (const period of periods) {
    (schedule[period] || []).forEach((item, index) => {
      rows.push({
        title: item.title,
        description: item.detail,
        period,
        sort_order: index + 1,
      });
    });
  }
  return rows;
}

export function toDailySchedule(
  schedule: CareCompanionResult["daily_schedule"],
): CarePlanDailySchedule {
  return {
    morning: schedule.morning || [],
    afternoon: schedule.afternoon || [],
    evening: schedule.evening || [],
    night: schedule.night || [],
  };
}

export function instructionsToList(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function buildFollowupTimeline(
  nextSteps: string[],
  followUpDate?: string | null,
): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];
  if (followUpDate) {
    items.push({
      title: "Clinic follow-up",
      due_date: followUpDate,
      kind: "appointment",
    });
  }
  nextSteps.forEach((step, i) => {
    items.push({
      title: step,
      offset_days: i + 1,
      kind: "recovery_step",
    });
  });
  return items;
}

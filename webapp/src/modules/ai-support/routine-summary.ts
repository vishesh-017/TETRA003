import { getStore } from "@/data/store";
import { buildLivePatientSnapshot } from "@/modules/ai-support/patient-snapshot";
import {
  fetchPatientSummary,
  isAiServiceConfigured,
} from "@/services/ai.service";

export interface DoctorRoutineSummary {
  headline: string;
  paragraphs: string[];
  bullets: string[];
  adherence_note: string;
  generated_at: string;
  provider: string;
}

function flattenDailySchedule(
  schedule: {
    morning?: Array<{ title: string; detail?: string }>;
    afternoon?: Array<{ title: string; detail?: string }>;
    evening?: Array<{ title: string; detail?: string }>;
    night?: Array<{ title: string; detail?: string }>;
  } | null,
): string[] {
  if (!schedule) return [];
  const lines: string[] = [];
  for (const period of ["morning", "afternoon", "evening", "night"] as const) {
    for (const item of schedule[period] || []) {
      lines.push(`${period}: ${item.title}${item.detail ? ` — ${item.detail}` : ""}`);
    }
  }
  return lines.slice(0, 12);
}

/** Payload for POST /ai/patient-summary (OpenRouter-backed on ai-service). */
export function buildPatientSummaryPayload(patientId: string) {
  const store = getStore();
  const snap = buildLivePatientSnapshot(patientId);
  const checkins = store.checkins
    .filter((c) => c.patient_id === patientId)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    .slice(0, 8);
  const meds = store.medicines.filter(
    (m) => m.patient_id === patientId && m.active,
  );
  const appts = store.appointments
    .filter((a) => a.patient_id === patientId)
    .sort((a, b) => (b.scheduled_at || "").localeCompare(a.scheduled_at || ""))
    .slice(0, 4);
  const carePlan =
    store.carePlans.find(
      (c) => c.patient_id === patientId && c.status === "active",
    ) ||
    store.carePlans.find((c) => c.patient_id === patientId) ||
    null;
  const timeline = store.healthRecords
    .filter((r) => r.patient_id === patientId)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    .slice(0, 10)
    .map((r) => ({
      at: r.recorded_at,
      category: r.category,
      title: r.title,
      summary: r.summary,
    }));
  const daily_schedule = flattenDailySchedule(carePlan?.daily_schedule || null);

  return {
    patient_name: snap?.full_name || "Patient",
    age: snap?.age ?? null,
    sex: snap?.sex ?? null,
    chronic_conditions: snap?.chronic_diseases || [],
    allergies: snap?.allergies || [],
    recovery_score: snap?.recovery_score ?? null,
    risk_level: snap?.risk_level ?? null,
    vitals: checkins.map((c) => ({
      date: c.recorded_at,
      bp_systolic: c.bp_systolic,
      bp_diastolic: c.bp_diastolic,
      blood_sugar: c.blood_sugar,
      temperature: c.temperature,
      oxygen: c.oxygen,
      weight: c.weight,
      pain_score: c.pain_score,
    })),
    checkins: checkins.map((c) => ({
      recorded_at: c.recorded_at,
      symptoms: c.symptoms || [],
      notes: c.notes,
      medicine_taken: c.medicine_taken,
    })),
    medicines: meds.map((m) => ({
      name: m.name,
      adherence_percent: null,
      missed_doses: null,
    })),
    appointments: appts.map((a) => ({
      scheduled_at: a.scheduled_at,
      status: a.status,
      appointment_type: a.appointment_type || a.location || null,
    })),
    extra_context: {
      health_timeline: timeline,
      daily_schedule,
      care_plan_summary: carePlan?.ai_summary || null,
      medical_history: snap?.medical_history || null,
    },
  };
}

/** Dynamic local summary of recent patient routine for doctor view. */
export function summarizePatientRoutine(patientId: string): DoctorRoutineSummary {
  const store = getStore();
  const snap = buildLivePatientSnapshot(patientId);
  const now = new Date().toISOString();

  if (!snap) {
    return {
      headline: "No live record available",
      paragraphs: ["NA — could not load this patient's store snapshot."],
      bullets: [],
      adherence_note: "NA",
      generated_at: now,
      provider: "local-rules",
    };
  }

  const checkins = store.checkins
    .filter((c) => c.patient_id === patientId)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    .slice(0, 7);

  const carePlan =
    store.carePlans.find(
      (c) => c.patient_id === patientId && c.status === "active",
    ) ||
    store.carePlans.find((c) => c.patient_id === patientId) ||
    null;
  const scheduleLines = flattenDailySchedule(carePlan?.daily_schedule || null);
  const timeline = store.healthRecords
    .filter((r) => r.patient_id === patientId)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    .slice(0, 6);

  const meds = store.medicines.filter(
    (m) => m.patient_id === patientId && m.active,
  );
  const logs = (store.medicineEvents || []).filter(
    (l) => l.patient_id === patientId,
  );
  const recentLogs = logs.filter((l) => {
    const day = l.acted_at || l.scheduled_for || l.date;
    if (!day) return false;
    const age = Date.now() - new Date(day).getTime();
    return age < 1000 * 60 * 60 * 24 * 7;
  });
  const taken = recentLogs.filter(
    (l) => l.status === "taken" || l.status === "late",
  ).length;
  const adherence =
    recentLogs.length > 0
      ? Math.round((taken / recentLogs.length) * 100)
      : meds.length
        ? null
        : null;

  const sparse = !checkins.length && !scheduleLines.length && !timeline.length;

  if (sparse) {
    return {
      headline: "Routine summary · awaiting data",
      paragraphs: [
        `${snap.full_name}: NA — no recent health timeline, check-ins, or daily schedule yet. Summary will fill in after the first logs.`,
      ],
      bullets: [
        "Check-ins: NA",
        "Daily schedule: NA",
        "Health timeline: NA",
        `Conditions on file: ${snap.chronic_diseases.join(", ") || "NA"}`,
        `Recovery / risk: NA`,
      ],
      adherence_note: "NA — no medicine logs yet",
      generated_at: now,
      provider: "local-rules",
    };
  }

  const tasks = store.careTasks.filter((t) => t.patient_id === patientId);
  const today = new Date().toISOString().slice(0, 10);
  const completions = store.taskCompletions.filter(
    (c) => c.patient_id === patientId && c.date === today,
  );
  const done = completions.filter((c) => c.status === "completed").length;
  const taskPct = tasks.length ? Math.round((done / tasks.length) * 100) : null;

  const latest = checkins[0];
  const symptomSet = new Set<string>();
  for (const c of checkins) {
    for (const s of c.symptoms || []) symptomSet.add(s);
  }

  const bpTrend = checkins
    .filter((c) => c.bp_systolic != null)
    .slice(0, 5)
    .map((c) => `${c.bp_systolic}/${c.bp_diastolic ?? "—"}`)
    .join(" → ");

  const sugarTrend = checkins
    .filter((c) => c.blood_sugar != null)
    .slice(0, 5)
    .map((c) => String(c.blood_sugar))
    .join(" → ");

  const missedMeds = recentLogs.filter(
    (l) => l.status === "missed" || l.status === "skipped",
  ).length;

  const bullets: string[] = [];
  bullets.push(
    checkins.length
      ? `${checkins.length} recent check-in(s) · latest ${new Date(latest!.recorded_at).toLocaleString()}`
      : "Check-ins: NA",
  );
  if (bpTrend) bullets.push(`BP series: ${bpTrend}`);
  if (sugarTrend) bullets.push(`Sugar series: ${sugarTrend}`);
  if (symptomSet.size) {
    bullets.push(`Reported symptoms: ${[...symptomSet].slice(0, 6).join(", ")}`);
  }
  bullets.push(
    adherence != null
      ? `Medicine adherence (7d logs): ~${adherence}%` +
          (missedMeds ? ` · ${missedMeds} missed/skipped` : "")
      : "Medicine adherence: NA",
  );
  bullets.push(
    scheduleLines.length
      ? `Daily schedule items: ${scheduleLines.length} (from care plan)`
      : "Daily schedule: NA",
  );
  for (const line of scheduleLines.slice(0, 4)) {
    bullets.push(`Schedule · ${line}`);
  }
  if (timeline.length) {
    bullets.push(
      `Timeline: ${timeline
        .slice(0, 3)
        .map((t) => `${t.title} (${new Date(t.recorded_at).toLocaleDateString()})`)
        .join("; ")}`,
    );
  }
  bullets.push(
    taskPct != null
      ? `Care-plan task completion today: ${taskPct}% (${done}/${tasks.length})`
      : "Care-plan tasks: NA",
  );
  bullets.push(
    `Live risk ${snap.risk_level ?? "NA"} · Recovery ${snap.recovery_score ?? "NA"}`,
  );

  const mood = latest?.mood ? ` Mood logged as “${latest.mood}”.` : "";
  const sleep =
    latest?.sleep_hours != null
      ? ` Sleep last log: ${latest.sleep_hours}h.`
      : "";
  const medLine =
    adherence == null
      ? "Medicine adherence: NA — no recent logs."
      : adherence >= 80
        ? "Medicine routine looks mostly on track."
        : adherence >= 50
          ? "Medicine adherence is uneven — worth reinforcing timing."
          : "Medicine adherence looks poor in recent logs — prioritize counseling.";

  const paragraphs = [
    `${snap.full_name}'s assistive summary from recent health timeline + daily schedule. Conditions: ${snap.chronic_diseases.join(", ") || "NA"}.`,
    latest
      ? `Most recent vitals — BP ${latest.bp_systolic ?? "—"}/${latest.bp_diastolic ?? "—"}, sugar ${latest.blood_sugar ?? "—"}, SpO₂ ${latest.oxygen ?? "—"}.${mood}${sleep}`
      : "Recent vitals: NA — ask the patient to complete a check-in.",
    scheduleLines.length
      ? `Daily schedule highlights: ${scheduleLines.slice(0, 3).join("; ")}.`
      : "Daily schedule: NA — no care-plan schedule on file yet.",
    medLine,
  ];

  const headline =
    snap.risk_level === "critical" || snap.risk_level === "high"
      ? "Routine summary · elevated risk — review closely"
      : "Routine summary · recent timeline & daily schedule";

  return {
    headline,
    paragraphs,
    bullets,
    adherence_note: medLine,
    generated_at: now,
    provider: "local-rules",
  };
}

/** Local rules + OpenRouter patient-summary when AI service is configured. */
export async function summarizePatientRoutineAsync(
  patientId: string,
): Promise<DoctorRoutineSummary> {
  const local = summarizePatientRoutine(patientId);
  if (!isAiServiceConfigured()) return local;

  try {
    const remote = await fetchPatientSummary(
      buildPatientSummaryPayload(patientId),
    );
    if (!remote || typeof remote !== "object") return local;
    const data = remote as {
      summary?: string;
      highlights?: string[];
      suggested_clinician_attention?: string[];
      meta?: { provider?: string };
    };
    if (!data.summary?.trim()) return local;

    const attention = (data.suggested_clinician_attention || []).map(
      (a) => `Review: ${a}`,
    );
    return {
      headline: local.headline,
      paragraphs: [
        data.summary.trim(),
        local.paragraphs[1] || "",
        local.paragraphs[2] || "",
        local.adherence_note,
      ].filter(Boolean),
      bullets: [
        ...(data.highlights || []),
        ...attention,
        ...local.bullets.slice(0, 5),
      ].slice(0, 12),
      adherence_note: local.adherence_note,
      generated_at: new Date().toISOString(),
      provider: data.meta?.provider || "ai-service",
    };
  } catch {
    return { ...local, provider: "local-fallback" };
  }
}

import { getStore } from "@/data/store";
import { buildLivePatientSnapshot } from "@/modules/ai-support/patient-snapshot";

export interface DoctorRoutineSummary {
  headline: string;
  paragraphs: string[];
  bullets: string[];
  adherence_note: string;
  generated_at: string;
}

/** Dynamic AI-style summary of recent patient routine for doctor view. */
export function summarizePatientRoutine(patientId: string): DoctorRoutineSummary {
  const store = getStore();
  const snap = buildLivePatientSnapshot(patientId);
  const now = new Date().toISOString();

  if (!snap) {
    return {
      headline: "No live record available",
      paragraphs: ["Could not load this patient's store snapshot."],
      bullets: [],
      adherence_note: "—",
      generated_at: now,
    };
  }

  const checkins = store.checkins
    .filter((c) => c.patient_id === patientId)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    .slice(0, 7);

  const meds = store.medicines.filter((m) => m.patient_id === patientId);
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
        ? 0
        : 100;

  const tasks = store.careTasks.filter((t) => t.patient_id === patientId);
  const today = new Date().toISOString().slice(0, 10);
  const completions = store.taskCompletions.filter(
    (c) => c.patient_id === patientId && c.date === today,
  );
  const done = completions.filter((c) => c.status === "completed").length;
  const taskPct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

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
    `${checkins.length} check-in(s) in recent history` +
      (latest
        ? ` · latest ${new Date(latest.recorded_at).toLocaleString()}`
        : " · none yet"),
  );
  if (bpTrend) bullets.push(`BP series: ${bpTrend}`);
  if (sugarTrend) bullets.push(`Sugar series: ${sugarTrend}`);
  if (symptomSet.size) {
    bullets.push(`Reported symptoms: ${[...symptomSet].slice(0, 6).join(", ")}`);
  }
  bullets.push(
    `Medicine adherence (7d logs): ~${adherence}%` +
      (missedMeds ? ` · ${missedMeds} missed/skipped` : ""),
  );
  bullets.push(`Care-plan task completion today: ${taskPct}% (${done}/${tasks.length})`);
  bullets.push(
    `Live risk ${snap.risk_level} · Recovery ${snap.recovery_score} · Readmit est. ${snap.readmission_probability_percent}%`,
  );

  const mood = latest?.mood ? ` Mood logged as “${latest.mood}”.` : "";
  const sleep =
    latest?.sleep_hours != null
      ? ` Sleep last log: ${latest.sleep_hours}h.`
      : "";
  const medLine =
    adherence >= 80
      ? "Medicine routine looks mostly on track."
      : adherence >= 50
        ? "Medicine adherence is uneven — worth reinforcing timing."
        : "Medicine adherence looks poor in recent logs — prioritize counseling.";

  const paragraphs = [
    `${snap.full_name}'s recent routine (assistive AI summary): ${checkins.length ? "check-ins are flowing into the record" : "few or no check-ins yet"}. Conditions on file: ${snap.chronic_diseases.join(", ") || "none listed"}.`,
    latest
      ? `Most recent vitals — BP ${latest.bp_systolic ?? "—"}/${latest.bp_diastolic ?? "—"}, sugar ${latest.blood_sugar ?? "—"}, SpO₂ ${latest.oxygen ?? "—"}.${mood}${sleep}`
      : "No recent vitals logged — ask the patient to complete a check-in.",
    medLine,
  ];

  const headline =
    snap.risk_level === "critical" || snap.risk_level === "high"
      ? "Routine summary · elevated risk — review closely"
      : "Routine summary · recent home-care pattern";

  return {
    headline,
    paragraphs,
    bullets,
    adherence_note: medLine,
    generated_at: now,
  };
}

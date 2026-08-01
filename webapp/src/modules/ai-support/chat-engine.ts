import { runAiCheckup } from "@/modules/ai-support/checkup-engine";
import {
  formatHospitalAnswer,
  queryAiDatabase,
  shouldPreferDatabase,
} from "@/modules/ai-support/database";
import { buildLivePatientSnapshot } from "@/modules/ai-support/patient-snapshot";
import type { AiAssistantResult } from "@/services/ai.service";
import {
  askHealthAssistant as askRemote,
  isAiServiceConfigured,
} from "@/services/ai.service";

const DISCLAIMER =
  "AI Care Companion assists only. It never diagnoses, never prescribes, and never replaces your doctor. Hospital/PM-JAY answers come from the HealNexus database.";

function localReply(
  question: string,
  userOrPatientId: string,
): AiAssistantResult {
  const db = queryAiDatabase(question, userOrPatientId);
  const snap = buildLivePatientSnapshot(userOrPatientId);
  const checkup = runAiCheckup(userOrPatientId);
  const q = question.toLowerCase();

  if (!snap || !checkup) {
    // Still answer hospital/PM-JAY from registry without patient login
    if (db.topic === "hospitals" || db.topic === "pmjay" || /hospital|pm-?jay|opd/.test(q)) {
      const formatted = formatHospitalAnswer(db, question);
      return {
        summary: formatted.summary,
        key_points: formatted.key_points,
        when_to_contact_doctor: [
          "For emergencies dial 108",
          "Verify PM-JAY packages at the hospital help desk",
        ],
        disclaimer: DISCLAIMER,
        provider: "healnexus-db",
      };
    }
    return {
      summary:
        "I could not load your live patient record. Sign in as a patient, or ask about PM-JAY hospitals in our database.",
      key_points: [],
      when_to_contact_doctor: [
        "Chest pain, severe breathlessness, confusion, or fainting",
      ],
      disclaimer: DISCLAIMER,
      provider: "healnexus-db",
    };
  }

  const key_points: string[] = [];
  let summary = "";
  let provider = "healnexus-db";

  // --- Database-first topics (never invent hospitals / meds / labs) ---
  if (
    db.topic === "hospitals" ||
    db.topic === "pmjay" ||
    (/hospital|opd/.test(q) && /pm-?jay|ayushman|empanel|cashless|opd/.test(q)) ||
    (/hospital/.test(q) && !/refer|specialist/.test(q))
  ) {
    const formatted = formatHospitalAnswer(db, question);
    summary = formatted.summary;
    key_points.push(...formatted.key_points);
    if (db.benefits_summary) key_points.push(db.benefits_summary);
  } else if (db.topic === "benefits") {
    summary =
      db.benefits_summary ||
      "Open Benefits & PM-JAY in the app to assess eligibility and link ABHA.";
    key_points.push(
      ...db.hospitals.slice(0, 3).map((h) => `${h.name} · ${h.area} · PM-JAY`),
      "Helpline 14555 for national PM-JAY guidance",
    );
  } else if (/risk|score|recover|readmit|checkup|assess/.test(q)) {
    summary = checkup.summary;
    key_points.push(
      `Overall risk: ${checkup.overall_risk}`,
      `Recovery Score: ${checkup.recovery_score}`,
      `Readmission ≈ ${checkup.readmission_probability_percent}%`,
      ...checkup.disease_scores
        .filter((d) => d.score > 0)
        .slice(0, 3)
        .map((d) => `${d.label} score ${d.score} (${d.band})`),
    );
  } else if (/lab|investig|test|screen|missing|blood report/.test(q)) {
    summary = checkup.missing_investigations.length
      ? `From your live investigations record: ${checkup.missing_investigations.length} screening test(s) look missing or not yet ordered.`
      : "No major missing screening tests vs your conditions and ordered labs in the database.";
    key_points.push(
      ...checkup.missing_investigations
        .slice(0, 5)
        .map((m) => `${m.test_name}: ${m.reason}`),
      ...db.investigations.slice(0, 4),
    );
  } else if (/medicine|pill|dose|tablet|drug/.test(q)) {
    summary = snap.medicines.length
      ? `From your medicines table: ${snap.medicines.length} active medicine(s).`
      : "No active medicines in the database — add them under Medicines or ask your doctor.";
    key_points.push(
      ...snap.medicines.map(
        (m) =>
          `${m.name}${m.dose ? ` ${m.dose}` : ""} · ${m.time_slots.join(", ") || m.frequency || "as directed"}`,
      ),
    );
  } else if (/appointment|visit|schedule|book/.test(q)) {
    summary = db.appointments.length
      ? `You have ${db.appointments.length} recent appointment(s) in the database.`
      : "No appointments on file — open Appointments to request one.";
    key_points.push(
      ...db.appointments.map(
        (a) =>
          `${new Date(a.when).toLocaleString()} · ${a.doctor} · ${a.status} · ${a.location}`,
      ),
    );
  } else if (/symptom|warning|danger|emergency|pain|breath/.test(q)) {
    summary = checkup.warning_signs.length
      ? `From your live alerts/vitals: ${checkup.warning_signs.length} warning signal(s).`
      : "No acute warning signs on your latest live data.";
    key_points.push(...checkup.warning_signs.slice(0, 6));
    if (/emergency|108/.test(q)) {
      const emerg = queryAiDatabase("emergency hospital", userOrPatientId).hospitals;
      key_points.push(
        ...emerg.slice(0, 3).map((h) => `Emergency: ${h.name} · ${h.phone}`),
      );
    }
  } else if (/refer|specialist/.test(q)) {
    summary = checkup.referral.message;
    key_points.push(
      `Urgency: ${checkup.referral.urgency}`,
      `Specialty: ${checkup.referral.specialty}`,
      ...checkup.referral.reasons,
      ...db.doctors.slice(0, 2).map((d) => `Panel: ${d.name} · ${d.specialty} · ${d.hospital}`),
    );
  } else if (/habit|lifestyle|exercise|sleep|salt|sugar control/.test(q)) {
    summary = `Your saved lifestyle targets in the database: exercise ${snap.lifestyle.exercise_minutes_week} min/week, sleep ${snap.lifestyle.sleep_hours} hrs, salt ${snap.lifestyle.salt_level}, sugar control ${snap.lifestyle.sugar_control}.`;
    key_points.push(
      "Open Care Plan → Lifestyle Simulator to adjust habits",
      `Current Recovery Score ${checkup.recovery_score}`,
      `Risk band ${checkup.overall_risk}`,
    );
  } else if (/vital|bp|sugar|check-?in|weight/.test(q)) {
    const v = checkup.latest_vitals;
    summary = v.recorded_at
      ? `Latest check-in in the database (${new Date(v.recorded_at).toLocaleString()}): BP ${v.bp}, sugar ${v.sugar || "—"}, weight ${v.weight || "—"}.`
      : "No check-in vitals in the database yet — complete Check-in.";
    key_points.push(
      ...(v.symptoms.length
        ? [`Symptoms: ${v.symptoms.join(", ")}`]
        : ["No symptoms logged on latest check-in"]),
      `Check-ins on file: ${snap.checkin_count}`,
    );
  } else if (/care plan|task|today|schedule/.test(q)) {
    summary =
      snap.care_plan_summary ||
      "Your care plan is doctor-approved recovery guidance stored in HealNexus.";
    key_points.push(
      ...checkup.next_actions.slice(0, 4),
      ...snap.care_plan_warning_signs.slice(0, 2).map((w) => `Watch: ${w}`),
    );
  } else if (/doctor|who is my doctor|care team/.test(q)) {
    summary = db.doctors.length
      ? `Doctors linked in the HealNexus database: ${db.doctors.length}.`
      : "No doctor profiles found.";
    key_points.push(
      ...db.doctors.map((d) => `${d.name} · ${d.specialty} · ${d.hospital}`),
    );
  } else {
    summary = `Hi ${snap.full_name.split(" ")[0]} — I'm linked to the HealNexus database (risk ${checkup.overall_risk}, recovery ${checkup.recovery_score}). Ask about PM-JAY hospitals, OPD, labs, medicines, appointments, or risk.`;
    key_points.push(...checkup.next_actions.slice(0, 4));
    provider = "healnexus-db";
  }

  const when_to_contact_doctor = [
    ...checkup.warning_signs.slice(0, 3),
    "Chest pain, severe breathlessness, confusion, fainting, or sudden weakness",
    checkup.referral.recommended
      ? checkup.referral.message
      : "Contact your doctor if symptoms worsen or medicines cannot be taken",
  ];

  return {
    summary,
    key_points: key_points.filter(Boolean).slice(0, 8),
    when_to_contact_doctor: [...new Set(when_to_contact_doctor)].slice(0, 5),
    disclaimer: DISCLAIMER,
    provider,
  };
}

/**
 * Grounded assistant linked to HealNexus database.
 * Factual topics (hospitals, PM-JAY, meds, labs) always use DB.
 * Optional ai-service may enrich education-only questions — still with DB context.
 */
export async function askGroundedAssistant(
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
  userOrPatientId: string,
): Promise<AiAssistantResult> {
  const last = [...messages].reverse().find((m) => m.role === "user");
  if (!last?.content) {
    const checkup = runAiCheckup(userOrPatientId);
    return {
      summary: checkup
        ? `Hi ${checkup.patient_name.split(" ")[0]} — connected to your HealNexus record (risk ${checkup.overall_risk}, recovery ${checkup.recovery_score}).`
        : "Ask about hospitals, PM-JAY, labs, or recovery — I read the HealNexus database.",
      key_points: checkup?.next_actions.slice(0, 4) || [],
      when_to_contact_doctor: checkup?.warning_signs.slice(0, 3) || [],
      disclaimer: DISCLAIMER,
      provider: "healnexus-db",
    };
  }

  const db = queryAiDatabase(last.content, userOrPatientId);
  const local = localReply(last.content, userOrPatientId);

  // Never let remote/web AI invent hospitals or meds — DB wins.
  if (shouldPreferDatabase(db.topic)) {
    return { ...local, provider: "healnexus-db" };
  }

  if (!isAiServiceConfigured()) return local;

  try {
    const remote = await askRemote(messages, {
      patient_context: db.context_json,
      local_summary: local.summary,
    });
    if (remote.provider === "stub" || remote.provider === "error") return local;
    return {
      summary: remote.summary,
      key_points: [
        ...(remote.key_points || []),
        ...local.key_points.slice(0, 2),
      ].slice(0, 8),
      when_to_contact_doctor: [
        ...(remote.when_to_contact_doctor || []),
        ...local.when_to_contact_doctor.slice(0, 2),
      ].slice(0, 6),
      disclaimer: DISCLAIMER,
      provider: `healnexus-db+${remote.provider}`,
    };
  } catch {
    return local;
  }
}

export function greetingFromLive(userOrPatientId: string): string {
  const checkup = runAiCheckup(userOrPatientId);
  if (!checkup) {
    return "Hi — I'm linked to the HealNexus hospital & care database. Ask about PM-JAY hospitals, OPD, or sign in as a patient for your live risk scores.";
  }
  return `Hi ${checkup.patient_name.split(" ")[0]} — I'm your AI support assistant linked to the HealNexus database. Live risk ${checkup.overall_risk} · Recovery ${checkup.recovery_score}. Ask about PM-JAY hospitals, missing labs, medicines, or warning signs.`;
}

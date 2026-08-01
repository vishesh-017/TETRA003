import type { RiskLevel } from "@/data/store/types";
import { EMERGENCY_SYMPTOMS } from "@/lib/health-engine/constants";
import {
  buildLivePatientSnapshot,
  type LivePatientSnapshot,
} from "@/modules/ai-support/patient-snapshot";
import type {
  AiCheckupResult,
  DiseaseRiskScore,
  ReferralAdvice,
  ScreeningRecommendation,
} from "@/modules/ai-support/types";

const DISCLAIMER =
  "AI Checkup reports current abnormalities from your live record only. It never diagnoses or replaces a clinician.";

function band(score: number): RiskLevel {
  if (score >= 85) return "critical";
  if (score >= 70) return "high";
  if (score >= 45) return "moderate";
  return "low";
}

function sugarScore(sugar: number | null): number {
  if (sugar == null) return 0;
  if (sugar >= 250) return 92;
  if (sugar >= 180) return 78;
  if (sugar >= 140) return 62;
  if (sugar >= 110) return 45;
  return 28;
}

function bpScore(sys: number | null): number {
  if (sys == null) return 0;
  if (sys >= 180) return 96;
  if (sys >= 160) return 82;
  if (sys >= 140) return 68;
  if (sys >= 130) return 48;
  return 26;
}

/** What the patient appears to be experiencing right now (live signals). */
function currentSuffering(snap: LivePatientSnapshot): string[] {
  const items: string[] = [];
  const c = snap.latest_checkin;
  if (c?.blood_sugar != null && c.blood_sugar >= 180) {
    items.push(
      `High blood sugar right now (${c.blood_sugar} mg/dL) — diabetes control concern`,
    );
  } else if (c?.blood_sugar != null && c.blood_sugar >= 140) {
    items.push(`Elevated blood sugar (${c.blood_sugar} mg/dL)`);
  }
  if (c?.bp_systolic != null && c.bp_systolic >= 160) {
    items.push(
      `High blood pressure right now (${c.bp_systolic}/${c.bp_diastolic ?? "—"} mmHg)`,
    );
  } else if (c?.bp_systolic != null && c.bp_systolic >= 140) {
    items.push(`Raised blood pressure (${c.bp_systolic} mmHg)`);
  }
  if (c?.oxygen != null && c.oxygen < 94) {
    items.push(`Low oxygen saturation (${c.oxygen}%)`);
  }
  if (c?.pain_score != null && c.pain_score >= 6) {
    items.push(`Significant pain (score ${c.pain_score}/10)`);
  }
  for (const s of c?.symptoms || []) {
    items.push(`Symptom now: ${s}`);
  }
  for (const disease of snap.chronic_diseases) {
    items.push(`Known condition on record: ${disease}`);
  }
  for (const a of snap.open_alerts) {
    items.push(`Open alert: ${a.title}`);
  }
  if (!items.length) {
    items.push(
      snap.latest_checkin
        ? "No acute abnormality on latest check-in — continue monitoring"
        : "No recent check-in — complete Check-in so AI can assess what you are experiencing now",
    );
  }
  return items;
}

function criticalityScore(
  snap: LivePatientSnapshot,
  scores: DiseaseRiskScore[],
  warnings: string[],
): { score: number; level: RiskLevel; drivers: string[] } {
  const maxDisease = Math.max(0, ...scores.map((s) => s.score));
  const emergency = warnings.some((w) =>
    /severe|hypertensive-range|chest|breath|oxygen|faint|confusion|250|180 mm/i.test(
      w,
    ),
  );
  let score = Math.round(
    maxDisease * 0.55 +
      (snap.readmission_probability_percent || 0) * 0.25 +
      Math.max(0, 100 - snap.recovery_score) * 0.2,
  );
  if (emergency) score = Math.max(score, 88);
  if (warnings.length >= 3) score = Math.max(score, 75);
  score = Math.min(100, score);
  const level = band(score);
  const drivers = [
    ...scores
      .filter((s) => s.score >= 60)
      .map((s) => `${s.label} ${s.score}`),
    ...warnings.slice(0, 2),
  ];
  return { score, level, drivers };
}

function buildDiseaseScores(snap: LivePatientSnapshot): DiseaseRiskScore[] {
  const sugar = snap.latest_checkin?.blood_sugar ?? null;
  const sys = snap.latest_checkin?.bp_systolic ?? null;
  const adherence = snap.health.recovery.factor_scores.medicine_adherence ?? 70;
  const diabetes = sugarScore(sugar);
  const hypertension = bpScore(sys);
  const ckd =
    sugar || sys
      ? Math.round(
          ((hypertension || 35) * 0.55 + (diabetes || 35) * 0.45) * 0.95,
        )
      : 0;
  const cardio = sys
    ? Math.min(
        100,
        Math.round(
          hypertension * 0.7 +
            (snap.latest_checkin?.oxygen != null &&
            snap.latest_checkin.oxygen < 94
              ? 20
              : 0) +
            (adherence < 70 ? 10 : 0),
        ),
      )
    : 0;
  const stroke = sys
    ? Math.min(
        100,
        Math.round(
          hypertension * 0.65 + (snap.age != null && snap.age >= 60 ? 15 : 5),
        ),
      )
    : 0;

  const mk = (
    key: string,
    label: string,
    score: number,
    drivers: string[],
  ): DiseaseRiskScore => ({
    key,
    label,
    score,
    band: score === 0 ? "low" : band(score),
    drivers: score === 0 ? ["No live vitals for this score"] : drivers,
  });

  return [
    mk("diabetes", "Diabetes", diabetes, [
      sugar != null ? `Sugar ${sugar} mg/dL` : "No sugar reading",
    ]),
    mk("hypertension", "Hypertension", hypertension, [
      sys != null
        ? `BP ${sys}/${snap.latest_checkin?.bp_diastolic ?? "—"}`
        : "No BP reading",
    ]),
    mk("ckd", "CKD", ckd, ["From BP + glucose signals"]),
    mk("cardiovascular", "Cardiovascular", cardio, [
      "BP, oxygen, adherence",
    ]),
    mk("stroke", "Stroke", stroke, [
      sys != null ? `Systolic ${sys}` : "No BP",
      snap.age != null ? `Age ${snap.age}` : "Age unknown",
    ]),
  ];
}

function buildWarnings(snap: LivePatientSnapshot): string[] {
  const warnings: string[] = [];
  const c = snap.latest_checkin;
  if (c?.bp_systolic != null && c.bp_systolic >= 180) {
    warnings.push(
      `Hypertensive-range BP ${c.bp_systolic}/${c.bp_diastolic ?? "—"} mmHg`,
    );
  } else if (c?.bp_systolic != null && c.bp_systolic >= 160) {
    warnings.push(`Markedly elevated BP ${c.bp_systolic} mmHg`);
  }
  if (c?.blood_sugar != null && c.blood_sugar >= 250) {
    warnings.push(`Severe hyperglycemia ${c.blood_sugar} mg/dL`);
  } else if (c?.blood_sugar != null && c.blood_sugar >= 180) {
    warnings.push(`Elevated blood sugar ${c.blood_sugar} mg/dL`);
  }
  if (c?.oxygen != null && c.oxygen < 94) {
    warnings.push(`Low oxygen saturation ${c.oxygen}%`);
  }
  for (const s of c?.symptoms || []) {
    if (
      [...EMERGENCY_SYMPTOMS].some((e) => s.toLowerCase().includes(e)) ||
      /chest|breath|faint|confusion|swelling|edema/i.test(s)
    ) {
      warnings.push(`Concerning symptom: ${s}`);
    }
  }
  for (const a of snap.open_alerts) {
    warnings.push(a.reason || a.title);
  }
  return warnings;
}

function buildReferral(
  _snap: LivePatientSnapshot,
  scores: DiseaseRiskScore[],
  warnings: string[],
  criticality: RiskLevel,
): ReferralAdvice {
  const maxDisease = Math.max(0, ...scores.map((s) => s.score));
  const emergency = warnings.some((w) =>
    /severe|hypertensive-range|chest|breath|oxygen|faint|confusion/i.test(w),
  );
  const reasons: string[] = [];
  if (emergency) reasons.push("Emergency-pattern warning signs present");
  if (criticality === "critical" || criticality === "high")
    reasons.push(`Criticality: ${criticality}`);
  if (maxDisease >= 70) reasons.push("One or more disease scores ≥70");

  const diabetes = scores.find((s) => s.key === "diabetes")?.score ?? 0;
  const bp = scores.find((s) => s.key === "hypertension")?.score ?? 0;
  const ckd = scores.find((s) => s.key === "ckd")?.score ?? 0;
  const cardio = scores.find((s) => s.key === "cardiovascular")?.score ?? 0;

  let specialty = "Internal Medicine / Family Physician";
  if (cardio >= 70 || bp >= 80) specialty = "Cardiology";
  else if (diabetes >= 70) specialty = "Endocrinology";
  else if (ckd >= 70) specialty = "Nephrology";

  const recommended =
    emergency ||
    criticality === "critical" ||
    criticality === "high" ||
    maxDisease >= 70 ||
    warnings.length >= 2;

  const urgency = emergency
    ? "emergency"
    : criticality === "critical" || maxDisease >= 85
      ? "urgent"
      : recommended
        ? "soon"
        : "routine";

  return {
    recommended,
    urgency,
    specialty,
    message: recommended
      ? `Based on what you are experiencing now, seek ${specialty} review (${urgency}).`
      : "No specialty referral indicated from current live signals — continue monitoring.",
    reasons,
  };
}

export function runAiCheckup(userOrPatientId: string): AiCheckupResult | null {
  const snap = buildLivePatientSnapshot(userOrPatientId);
  if (!snap) return null;

  const missingFields: string[] = [];
  if (!snap.latest_checkin) missingFields.push("Recent vitals / check-in");
  if (!snap.medicines.length) missingFields.push("Active medicines");
  if (snap.age == null) missingFields.push("Date of birth / age");

  const disease_scores = buildDiseaseScores(snap);
  const warning_signs = buildWarnings(snap);
  const suffering = currentSuffering(snap);
  const crit = criticalityScore(snap, disease_scores, warning_signs);
  const referral = buildReferral(
    snap,
    disease_scores,
    warning_signs,
    crit.level,
  );

  const emptyScreening: ScreeningRecommendation[] = [];

  const next_actions: string[] = [];
  if (!snap.latest_checkin) {
    next_actions.push("Complete Check-in now so AI can read current vitals.");
  }
  if (crit.level === "critical" || crit.level === "high") {
    next_actions.push(
      `Priority: contact your doctor / ${referral.specialty} — criticality ${crit.score}/100.`,
    );
  }
  if (warning_signs.length) {
    next_actions.push("Review warning signs and escalate if they worsen.");
  }
  next_actions.push("Follow your care-plan medicines and today's tasks.");
  next_actions.push("Use Lifestyle Simulator only after today's plan is clear.");

  const first = snap.full_name.split(" ")[0] || "Patient";
  const summary = [
    `${first} AI Checkup (live): criticality ${crit.score}/100 (${crit.level}).`,
    `Right now: ${suffering.slice(0, 2).join("; ")}.`,
    `Recovery ${snap.recovery_score}; readmission ≈ ${snap.readmission_probability_percent}%.`,
    referral.message,
  ].join(" ");

  return {
    patient_id: snap.patient_id,
    patient_name: snap.full_name,
    assessed_at: new Date().toISOString(),
    demographics: {
      age: snap.age,
      sex: snap.sex,
      conditions: snap.chronic_diseases,
      diagnosis: snap.diagnosis,
    },
    data_completeness: {
      has_vitals: Boolean(snap.latest_checkin),
      has_medicines: snap.medicines.length > 0,
      has_labs:
        snap.investigations.length > 0 || snap.clinical_reports.length > 0,
      has_history: Boolean(
        snap.medical_history || snap.chronic_diseases.length,
      ),
      missing_fields: missingFields,
    },
    overall_risk: crit.level,
    recovery_score: snap.recovery_score,
    readmission_probability_percent: snap.readmission_probability_percent,
    disease_scores,
    warning_signs: [...suffering, ...warning_signs],
    progression_signals: crit.drivers,
    missing_investigations: emptyScreening,
    screening_recommendations: emptyScreening,
    referral,
    medicines_summary: snap.medicines.map(
      (m) =>
        `${m.name}${m.dose ? ` ${m.dose}` : ""}${
          m.time_slots.length ? ` · ${m.time_slots.join("/")}` : ""
        }`,
    ),
    latest_vitals: {
      bp: snap.latest_checkin
        ? `${snap.latest_checkin.bp_systolic ?? "—"}/${snap.latest_checkin.bp_diastolic ?? "—"}`
        : null,
      sugar:
        snap.latest_checkin?.blood_sugar != null
          ? `${snap.latest_checkin.blood_sugar} mg/dL`
          : null,
      weight:
        snap.latest_checkin?.weight != null
          ? `${snap.latest_checkin.weight} kg`
          : null,
      symptoms: snap.latest_checkin?.symptoms || [],
      recorded_at: snap.latest_checkin?.recorded_at || null,
    },
    summary,
    next_actions,
    disclaimer: DISCLAIMER,
  };
}

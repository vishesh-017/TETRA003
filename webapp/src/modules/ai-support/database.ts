/**
 * AI ↔ HealNexus database bridge.
 * Every factual answer (hospitals, PM-JAY, meds, labs, doctors) is read from
 * the live local store + hospital registry — never invented by the model.
 */

import { AHMEDABAD_DEMO_HOSPITALS } from "@/data/ahmedabad-hospitals";
import { getStore } from "@/data/store";
import type { DemoHospital } from "@/types/domain";
import { buildLivePatientSnapshot } from "@/modules/ai-support/patient-snapshot";
import { runAiCheckup } from "@/modules/ai-support/checkup-engine";

export type AiDbTopic =
  | "hospitals"
  | "pmjay"
  | "medicines"
  | "investigations"
  | "appointments"
  | "doctors"
  | "benefits"
  | "patient"
  | "general";

export interface HospitalMatch {
  id: string;
  name: string;
  area: string;
  address: string;
  phone: string;
  pmjay_empanelled: boolean;
  is_emergency: boolean;
  hospital_type: string;
  services: string[];
  pmjay_departments: string[];
  opd_support: boolean;
}

export interface AiDatabaseBundle {
  topic: AiDbTopic;
  patient_id: string | null;
  hospitals: HospitalMatch[];
  pmjay_profile: {
    status: string;
    confidence: number;
    assessed_at: string | null;
    answers: Record<string, string>;
  } | null;
  doctors: Array<{ name: string; specialty: string; hospital: string }>;
  appointments: Array<{
    when: string;
    location: string;
    status: string;
    doctor: string;
  }>;
  medicines: string[];
  investigations: string[];
  benefits_summary: string | null;
  checkup_headline: string | null;
  /** Compact JSON for remote AI grounding */
  context_json: string;
}

function detectTopic(question: string): AiDbTopic {
  const q = question.toLowerCase();
  if (/pm-?jay|ayushman|empanel|cashless|secc|ayushman card/.test(q))
    return "pmjay";
  if (/hospital|opd|clinic|emergency\s*care|where (can|should) i (go|visit)/.test(q))
    return "hospitals";
  if (/medicine|pill|dose|tablet|drug|prescription/.test(q)) return "medicines";
  if (/lab|investig|test|screen|blood report|hba1c|creatinine/.test(q))
    return "investigations";
  if (/appointment|visit|schedule|book/.test(q)) return "appointments";
  if (/doctor|specialist|refer|cardiolog|endocrin/.test(q)) return "doctors";
  if (/benefit|abha|government|coverage|insurance/.test(q)) return "benefits";
  if (/risk|recover|vital|symptom|checkup|care plan|habit/.test(q))
    return "patient";
  return "general";
}

function supportsOpd(h: DemoHospital): boolean {
  const blob = [
    ...(h.services || []),
    ...(h.pmjay_departments || []),
  ]
    .join(" ")
    .toLowerCase();
  return (
    blob.includes("opd") ||
    blob.includes("general medicine") ||
    blob.includes("medicine") ||
    blob.includes("outpatient")
  );
}

function toMatch(h: DemoHospital): HospitalMatch {
  return {
    id: h.id,
    name: h.name,
    area: h.area || h.city,
    address: h.address,
    phone: h.phone || "14555",
    pmjay_empanelled: h.pmjay_empanelled,
    is_emergency: h.is_emergency,
    hospital_type: h.hospital_type,
    services: h.services || [],
    pmjay_departments: h.pmjay_departments || [],
    opd_support: supportsOpd(h),
  };
}

/** Query hospital registry with PM-JAY / OPD / emergency filters from the question. */
export function queryHospitals(question: string): HospitalMatch[] {
  const q = question.toLowerCase();
  const wantPmjay = /pm-?jay|ayushman|empanel|cashless/.test(q);
  const wantOpd = /\bopd\b|outpatient|out-patient/.test(q);
  const wantEmergency = /emergency|trauma|108/.test(q);
  const wantGov = /government|civil|public/.test(q);

  let rows = AHMEDABAD_DEMO_HOSPITALS.map(toMatch);

  if (wantPmjay) rows = rows.filter((h) => h.pmjay_empanelled);
  if (wantOpd) rows = rows.filter((h) => h.opd_support || h.pmjay_empanelled);
  if (wantEmergency) rows = rows.filter((h) => h.is_emergency);
  if (wantGov) rows = rows.filter((h) => h.hospital_type === "government");

  // Prefer PM-JAY + OPD when both mentioned
  if (wantPmjay && wantOpd) {
    rows = [...rows].sort((a, b) => {
      const score = (h: HospitalMatch) =>
        (h.pmjay_empanelled ? 2 : 0) + (h.opd_support ? 2 : 0) + (h.is_emergency ? 1 : 0);
      return score(b) - score(a);
    });
  }

  return rows.slice(0, 8);
}

/** Full DB bundle for a user question — patient store + hospital registry. */
export function queryAiDatabase(
  question: string,
  userOrPatientId: string,
): AiDatabaseBundle {
  const topic = detectTopic(question);
  const store = getStore();
  const snap = buildLivePatientSnapshot(userOrPatientId);
  const checkup = snap ? runAiCheckup(snap.patient_id) : null;
  const patientId = snap?.patient_id ?? null;

  const gov = patientId
    ? store.governmentProfiles.find((g) => g.patient_id === patientId) || null
    : null;

  const hospitals =
    topic === "hospitals" || topic === "pmjay" || /hospital|opd|pm-?jay/.test(question.toLowerCase())
      ? queryHospitals(question)
      : AHMEDABAD_DEMO_HOSPITALS.filter((h) => h.pmjay_empanelled)
          .slice(0, 3)
          .map(toMatch);

  const doctorRows = store.doctors.map((d) => {
    const profile = store.profiles.find((p) => p.id === d.user_id);
    return {
      name: profile?.full_name || "Doctor",
      specialty: d.specialty,
      hospital: d.hospital_affiliation,
    };
  });

  const appointments = patientId
    ? store.appointments
        .filter((a) => a.patient_id === patientId)
        .sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))
        .slice(0, 5)
        .map((a) => {
          const doc = store.doctors.find((d) => d.id === a.doctor_id);
          const docProfile = doc
            ? store.profiles.find((p) => p.id === doc.user_id)
            : null;
          return {
            when: a.scheduled_at,
            location: a.location,
            status: a.status,
            doctor: docProfile?.full_name || "Doctor",
          };
        })
    : [];

  const context = {
    source: "healnexus-database",
    topic,
    patient: snap
      ? {
          id: snap.patient_id,
          name: snap.full_name,
          age: snap.age,
          sex: snap.sex,
          diagnosis: snap.diagnosis,
          conditions: snap.chronic_diseases,
          recovery_score: snap.recovery_score,
          risk_level: snap.risk_level,
          medicines: snap.medicines,
          investigations: snap.investigations,
          latest_checkin: snap.latest_checkin,
          allergies: snap.allergies,
        }
      : null,
    pmjay: gov
      ? {
          status: gov.pmjay_status,
          confidence: gov.pmjay_confidence,
          assessed_at: gov.pmjay_assessed_at,
          answers: gov.pmjay_answers,
          abha_linked: gov.abha_linked,
          abha_id: gov.abha_id,
        }
      : null,
    hospitals,
    doctors: doctorRows,
    appointments,
    checkup: checkup
      ? {
          overall_risk: checkup.overall_risk,
          recovery_score: checkup.recovery_score,
          missing_tests: checkup.missing_investigations.map((m) => m.test_name),
          referral: checkup.referral,
        }
      : null,
  };

  return {
    topic,
    patient_id: patientId,
    hospitals,
    pmjay_profile: gov
      ? {
          status: gov.pmjay_status,
          confidence: gov.pmjay_confidence,
          assessed_at: gov.pmjay_assessed_at,
          answers: gov.pmjay_answers,
        }
      : null,
    doctors: doctorRows,
    appointments,
    medicines: snap?.medicines.map((m) => m.name) || [],
    investigations: snap?.investigations.map((i) => `${i.name} (${i.status})`) || [],
    benefits_summary: gov
      ? `PM-JAY status on file: ${gov.pmjay_status} (confidence ${Math.round(gov.pmjay_confidence * 100)}%)`
      : "No PM-JAY assessment saved yet — open Benefits & PM-JAY to complete the wizard.",
    checkup_headline: checkup
      ? `Live risk ${checkup.overall_risk} · Recovery ${checkup.recovery_score}`
      : null,
    context_json: JSON.stringify(context),
  };
}

/** Whether this question should be answered strictly from DB (skip web hallucination). */
export function shouldPreferDatabase(topic: AiDbTopic): boolean {
  return (
    topic === "hospitals" ||
    topic === "pmjay" ||
    topic === "medicines" ||
    topic === "investigations" ||
    topic === "appointments" ||
    topic === "doctors" ||
    topic === "benefits" ||
    topic === "patient"
  );
}

export function formatHospitalAnswer(db: AiDatabaseBundle, question: string): {
  summary: string;
  key_points: string[];
} {
  const q = question.toLowerCase();
  const wantOpd = /\bopd\b|outpatient/.test(q);
  const wantPmjay = /pm-?jay|ayushman|empanel|cashless/.test(q);
  const rows = db.hospitals;

  if (!rows.length) {
    return {
      summary:
        "No matching hospitals found in the HealNexus hospital registry for that filter. Open Hospitals map to browse the full list.",
      key_points: ["Open /maps for the live hospital map"],
    };
  }

  const label = wantPmjay && wantOpd
    ? "PM-JAY empanelled hospitals with OPD / general medicine support"
    : wantPmjay
      ? "PM-JAY empanelled hospitals"
      : wantOpd
        ? "Hospitals with OPD services"
        : "Hospitals";

  const summary = `From the HealNexus hospital database (${rows.length} match${rows.length === 1 ? "" : "es"}): ${label} in Ahmedabad. ${
    db.pmjay_profile
      ? `Your saved PM-JAY status is ${db.pmjay_profile.status}.`
      : "Complete Benefits → PM-JAY Assistant to save your eligibility status."
  } Verify packages at the hospital help desk — this is registry data, not a live government API.`;

  const key_points = rows.slice(0, 6).map((h) => {
    const bits = [
      h.name,
      h.area,
      h.pmjay_empanelled ? "PM-JAY" : "not PM-JAY",
      h.opd_support ? "OPD" : null,
      h.is_emergency ? "Emergency" : null,
      h.phone,
    ].filter(Boolean);
    const depts = h.pmjay_departments.slice(0, 3).join(", ");
    return depts ? `${bits.join(" · ")} — ${depts}` : bits.join(" · ");
  });

  return { summary, key_points };
}

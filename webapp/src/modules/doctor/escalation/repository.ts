import { addDays, format } from "date-fns";

import { getStore, IDS, newId, updateStore } from "@/data/store";
import { evaluateHealth, type RiskCategory } from "@/lib/health-engine";
import type { RiskLevel } from "@/modules/doctor/types";
import { doctorRepository } from "@/modules/doctor/repository";
import { buildObservationsForPatient } from "@/modules/prediction/adapters";

import type {
  EscalationBundle,
  EscalationPatientCard,
  PatientRiskData,
  ReferralPayload,
  RiskFilter,
} from "./types";

function mapRisk(category: RiskCategory): RiskLevel {
  if (category === "medium") return "moderate";
  return category;
}

function riskRank(level: RiskLevel): number {
  return { critical: 0, high: 1, moderate: 2, low: 3 }[level] ?? 4;
}

function clamp(n: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function districtFor(patientId: string): string {
  const store = getStore();
  const patient = store.patients.find((p) => p.id === patientId);
  const profile = patient
    ? store.profiles.find((p) => p.id === patient.user_id)
    : undefined;
  const addr = (patient?.address || profile?.address) as
    | { city?: string; district?: string; village?: string; state?: string }
    | null
    | undefined;
  return (
    addr?.district ||
    addr?.city ||
    addr?.village ||
    addr?.state ||
    "Ahmedabad"
  );
}

function latestDischarge(patientId: string) {
  return getStore()
    .discharges.filter((d) => d.patient_id === patientId)
    .sort((a, b) =>
      (b.discharge_date || b.created_at).localeCompare(
        a.discharge_date || a.created_at,
      ),
    )[0];
}

function sugarScore(sugar: number | null | undefined): number {
  if (sugar == null) return 35;
  if (sugar >= 250) return 92;
  if (sugar >= 180) return 78;
  if (sugar >= 140) return 62;
  if (sugar >= 110) return 45;
  return 28;
}

function bpScore(sys: number | null | undefined): number {
  if (sys == null) return 35;
  if (sys >= 180) return 96;
  if (sys >= 160) return 82;
  if (sys >= 140) return 68;
  if (sys >= 130) return 48;
  return 26;
}

function ensureDoctor(userId: string) {
  const store = getStore();
  return (
    store.doctors.find((d) => d.user_id === userId) ||
    store.doctors.find((d) => d.id === IDS.doctor)!
  );
}

function buildCard(patientId: string, userId: string): EscalationPatientCard {
  const list = doctorRepository.listPatients(userId);
  const item = list.find((p) => p.id === patientId)!;
  const discharge = latestDischarge(patientId);
  const diagnosis =
    discharge?.diagnosis_text ||
    (item.chronic_diseases || []).join(", ") ||
    "Post-discharge monitoring";

  let risk: RiskLevel = item.risk_level || "low";
  try {
    const obs = buildObservationsForPatient(patientId);
    risk = mapRisk(evaluateHealth(obs).readmission.risk_category);
  } catch {
    /* keep stored risk */
  }

  return {
    id: patientId,
    full_name: item.full_name,
    primary_diagnosis: diagnosis,
    discharge_date: discharge?.discharge_date || null,
    district: districtFor(patientId),
    risk_level: risk,
    age: item.age,
    conditions: item.chronic_diseases || [],
  };
}

export const escalationRepository = {
  getBundle(userId: string): EscalationBundle {
    const patients = doctorRepository
      .listPatients(userId, { status: "active" })
      .map((p) => buildCard(p.id, userId))
      .sort((a, b) => riskRank(a.risk_level) - riskRank(b.risk_level));

    const counts: Record<RiskFilter, number> = {
      all: patients.length,
      critical: patients.filter((p) => p.risk_level === "critical").length,
      high: patients.filter((p) => p.risk_level === "high").length,
      moderate: patients.filter((p) => p.risk_level === "moderate").length,
      low: patients.filter((p) => p.risk_level === "low").length,
    };

    return { patients, counts };
  },

  getRiskData(userId: string, patientId: string): PatientRiskData {
    ensureDoctor(userId);
    const card = buildCard(patientId, userId);
    const store = getStore();
    const checkins = store.checkins
      .filter((c) => c.patient_id === patientId)
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
    const latest = checkins[0];
    const previous = checkins[1];

    const sugar = latest?.blood_sugar ?? null;
    const sys = latest?.bp_systolic ?? null;
    const dia = latest?.bp_diastolic ?? null;

    const diabetes = sugarScore(sugar);
    const bp = bpScore(sys);
    const ckd = clamp((bp * 0.55 + diabetes * 0.45) * 0.95);
    const cardio = clamp(bp * 0.7 + (latest?.oxygen != null && latest.oxygen < 94 ? 20 : 0));
    const stroke = clamp(bp * 0.65 + (card.age && card.age >= 60 ? 15 : 5));

    const red_flags: string[] = [];
    if (sys != null && sys >= 180) {
      red_flags.push(`Hypertensive-range BP ${sys}/${dia ?? "—"} mmHg`);
    } else if (sys != null && sys >= 160) {
      red_flags.push(`Markedly elevated BP ${sys}/${dia ?? "—"} mmHg`);
    }
    if (sugar != null && sugar >= 250) {
      red_flags.push(`Severe hyperglycemia ${sugar} mg/dL`);
    } else if (sugar != null && sugar >= 180) {
      red_flags.push(`Elevated fasting / random sugar ${sugar} mg/dL`);
    }
    if (latest?.symptoms?.some((s) => /chest|breath|dizzy|pain/i.test(s))) {
      red_flags.push(`Concerning symptoms: ${latest.symptoms.join(", ")}`);
    }
    const openAlerts = store.alerts.filter(
      (a) => a.patient_id === patientId && a.status === "open",
    );
    for (const a of openAlerts.slice(0, 3)) {
      red_flags.push(a.reason || a.title);
    }

    const sugarRising =
      sugar != null &&
      previous?.blood_sugar != null &&
      sugar > previous.blood_sugar + 5;
    const bpRising =
      sys != null &&
      previous?.bp_systolic != null &&
      sys > previous.bp_systolic + 4;

    let explanation = `${card.full_name.split(" ")[0]} is under post-discharge monitoring for ${card.primary_diagnosis}.`;
    if (sys != null && sugar != null) {
      explanation = `${card.full_name.split(" ")[0]}'s latest vitals show BP ${sys}/${dia ?? "—"} mmHg and blood sugar ${sugar} mg/dL.`;
    }
    if (sugarRising) {
      explanation += " Blood sugar has been rising across recent check-ins.";
    }
    if (bpRising) {
      explanation += " Blood pressure trend is worsening.";
    }
    if (card.risk_level === "critical" || card.risk_level === "high") {
      explanation +=
        " Prioritize clinical review — AI organizes signals only; you decide next steps.";
    } else {
      explanation +=
        " Continue scheduled monitoring; intervene if red flags appear.";
    }

    const existingInv = new Set(
      store.investigations
        .filter(
          (i) =>
            i.patient_id === patientId &&
            i.status !== "cancelled" &&
            i.status !== "completed",
        )
        .map((i) => i.name.toLowerCase()),
    );

    const investigation_options = [
      { id: "hba1c", name: "HbA1c", ordered: existingInv.has("hba1c") },
      {
        id: "lipid",
        name: "Lipid Profile",
        ordered: [...existingInv].some((n) => n.includes("lipid")),
      },
      {
        id: "rft",
        name: "Renal Function Test",
        ordered: [...existingInv].some(
          (n) => n.includes("renal") || n.includes("rft") || n.includes("kidney"),
        ),
      },
      {
        id: "ecg",
        name: "ECG",
        ordered: [...existingInv].some((n) => n.includes("ecg")),
      },
    ];

    const referralRecommended =
      card.risk_level === "critical" ||
      card.risk_level === "high" ||
      red_flags.length >= 2;
    const specialty =
      bp >= 70 ? "Cardiology" : diabetes >= 70 ? "Endocrinology" : "Internal Medicine";

    return {
      patient_id: patientId,
      full_name: card.full_name,
      risk_level: card.risk_level,
      explanation,
      disease_scores: [
        { key: "diabetes", label: "Diabetes", score: diabetes },
        { key: "bp", label: "BP", score: bp },
        { key: "ckd", label: "CKD", score: ckd },
        { key: "cardio", label: "Cardio", score: cardio },
        { key: "stroke", label: "Stroke", score: stroke },
      ],
      red_flags: red_flags.length
        ? red_flags
        : ["No acute red flags on latest check-in"],
      investigation_options,
      referral: {
        recommended: referralRecommended,
        specialty,
        message: referralRecommended
          ? `Consider ${specialty} referral given current risk and disease scores.`
          : "No specialty referral required at this time.",
      },
      primary_diagnosis: card.primary_diagnosis,
      discharge_date: card.discharge_date,
      district: card.district,
    };
  },

  orderInvestigation(userId: string, patientId: string, name: string) {
    const doctor = ensureDoctor(userId);
    const now = new Date().toISOString();
    const due = format(addDays(new Date(), 3), "yyyy-MM-dd");
    const exists = getStore().investigations.some(
      (i) =>
        i.patient_id === patientId &&
        i.name.toLowerCase() === name.toLowerCase() &&
        i.status !== "cancelled" &&
        i.status !== "completed",
    );
    if (exists) return;

    updateStore((draft) => {
      draft.investigations.unshift({
        id: newId(),
        patient_id: patientId,
        doctor_id: doctor.id,
        discharge_id: null,
        name,
        purpose: `Ordered from escalation triage for ${name}`,
        due_date: due,
        priority: "important",
        notes: "Ordered from Active Panel / Risk Panel",
        status: "pending",
        preparation: null,
        completed_at: null,
        reviewed_at: null,
        reviewed_by: null,
        attachment_url: null,
        attachment_name: null,
        attachment_mime: null,
        reminder_sent_at: null,
        created_at: now,
        updated_at: now,
      });
      const patient = draft.patients.find((p) => p.id === patientId);
      if (patient) {
        draft.notifications.unshift({
          id: newId(),
          user_id: patient.user_id,
          type: "investigation",
          title: "New investigation ordered",
          body: `Your doctor ordered ${name}. Complete it by ${due}.`,
          read: false,
          created_at: now,
        });
      }
    });
  },

  acknowledgePatientAlerts(userId: string, patientId: string) {
    ensureDoctor(userId);
    updateStore((draft) => {
      for (const a of draft.alerts) {
        if (a.patient_id === patientId && a.status === "open") {
          a.status = "acknowledged";
        }
      }
    });
  },

  resolvePatientAlerts(userId: string, patientId: string) {
    ensureDoctor(userId);
    const now = new Date().toISOString();
    updateStore((draft) => {
      for (const a of draft.alerts) {
        if (
          a.patient_id === patientId &&
          (a.status === "open" || a.status === "acknowledged")
        ) {
          a.status = "resolved";
          a.resolved_at = now;
        }
      }
    });
  },

  submitReferral(userId: string, payload: ReferralPayload) {
    const doctor = ensureDoctor(userId);
    const now = new Date().toISOString();
    const patient = getStore().patients.find((p) => p.id === payload.patient_id);
    const profile = patient
      ? getStore().profiles.find((p) => p.id === patient.user_id)
      : undefined;

    updateStore((draft) => {
      draft.notifications.unshift({
        id: newId(),
        user_id: doctor.user_id,
        type: "referral",
        title: `${payload.urgency.toUpperCase()} referral — ${payload.specialty}`,
        body: `${profile?.full_name || "Patient"}: ${payload.clinical_reason}${
          payload.notes ? ` (${payload.notes})` : ""
        }`,
        read: false,
        created_at: now,
      });
      if (patient) {
        draft.notifications.unshift({
          id: newId(),
          user_id: patient.user_id,
          type: "referral",
          title: "Specialist referral submitted",
          body: `Your doctor referred you to ${payload.specialty} (${payload.urgency}).`,
          read: false,
          created_at: now,
        });
        draft.alerts.unshift({
          id: newId(),
          patient_id: payload.patient_id,
          alert_type: "referral",
          severity:
            payload.urgency === "emergency"
              ? "critical"
              : payload.urgency === "urgent"
                ? "high"
                : "moderate",
          title: `Referral to ${payload.specialty}`,
          body: payload.clinical_reason,
          reason: payload.clinical_reason,
          status: "open",
          assigned_doctor_id: doctor.id,
          checkin_id: null,
          resolved_at: null,
          created_at: now,
        });
      }
    });
  },
};

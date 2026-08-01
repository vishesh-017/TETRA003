import { AHMEDABAD_DEMO_HOSPITALS } from "@/data/ahmedabad-hospitals";
import {
  getStore,
  IDS,
  newId,
  updateStore,
  type GovernmentProfileRow,
  type HealthRecordCategory,
  type HealthRecordRow,
} from "@/data/store";
import { evaluateHealth } from "@/lib/health-engine";
import { buildObservationsForPatient } from "@/modules/prediction/adapters";
import {
  bundleToHealthRecords,
  fetchDemoAbhaBundle,
  wait,
} from "@/modules/identity/services/abha-import.service";
import { assessPmjayEligibility } from "@/modules/identity/services/pmjay-eligibility.service";
import type {
  BenefitsDashboard,
  DigitalPassport,
  EmergencyProfile,
  PmjayWizardAnswers,
  TimelineEvent,
} from "@/modules/identity/types";

function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const born = new Date(dob);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return age;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function ensureGov(patientId: string): GovernmentProfileRow {
  const store = getStore();
  const existing = (store.governmentProfiles ?? []).find(
    (g) => g.patient_id === patientId,
  );
  if (existing) return existing;
  const patient = store.patients.find((p) => p.id === patientId);
  const created: GovernmentProfileRow = {
    patient_id: patientId,
    abha_id: patient?.abha_id_demo ?? null,
    abha_linked: false,
    abha_linked_at: null,
    pmjay_status: "unknown",
    pmjay_confidence: 0,
    pmjay_answers: {},
    pmjay_assessed_at: null,
    linked_record_count: (store.healthRecords ?? []).filter(
      (r) => r.patient_id === patientId,
    ).length,
  };
  updateStore((draft) => {
    draft.governmentProfiles = draft.governmentProfiles ?? [];
    draft.governmentProfiles.push(created);
  });
  return created;
}

function resolvePatientId(userOrPatientId: string): string {
  const store = getStore();
  const byId = store.patients.find((p) => p.id === userOrPatientId);
  if (byId) return byId.id;
  const byUser = store.patients.find((p) => p.user_id === userOrPatientId);
  return byUser?.id ?? IDS.patient;
}

export const identityRepository = {
  resolvePatientId,

  getDigitalPassport(userOrPatientId: string): DigitalPassport | null {
    const store = getStore();
    const patientId = resolvePatientId(userOrPatientId);
    const patient = store.patients.find((p) => p.id === patientId);
    if (!patient) return null;
    const profile = store.profiles.find((p) => p.id === patient.user_id);
    if (!profile) return null;
    const passport = store.passports.find((p) => p.patient_id === patientId);
    const rel = store.relationships.find(
      (r) => r.patient_id === patientId && r.status === "active",
    );
    const doctor = rel
      ? store.doctors.find((d) => d.id === rel.doctor_id)
      : store.doctors[0];
    const doctorProfile = doctor
      ? store.profiles.find((p) => p.id === doctor.user_id)
      : null;

    const meds = store.medicines
      .filter((m) => m.patient_id === patientId && m.active)
      .map((m) => ({
        name: m.name,
        dose: m.dose ?? undefined,
        time: m.time_slots.join(", "),
      }));

    const checkins = store.checkins
      .filter((c) => c.patient_id === patientId)
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
    const nextAppt = store.appointments
      .filter(
        (a) =>
          a.patient_id === patientId &&
          a.status === "scheduled" &&
          new Date(a.scheduled_at) >= new Date(),
      )
      .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];

    const health = evaluateHealth(buildObservationsForPatient(patientId));

    let emergency_status: DigitalPassport["emergency_status"] = "stable";
    if (
      health.alerts.action === "emergency" ||
      health.alerts.action === "immediate_attention"
    ) {
      emergency_status = "urgent";
    } else if (
      health.alerts.action === "doctor_review" ||
      health.alerts.action === "monitor"
    ) {
      emergency_status = "monitor";
    }

    const hospital =
      doctor?.hospital_affiliation ||
      AHMEDABAD_DEMO_HOSPITALS.find((h) => h.is_emergency)?.name ||
      "Civil Hospital Ahmedabad";

    return {
      patient_id: patientId,
      full_name: profile.full_name,
      age: ageFromDob(patient.date_of_birth),
      sex: patient.sex,
      blood_group: passport?.blood_group ?? patient.blood_group,
      abha_id_demo: passport?.abha_id_demo ?? patient.abha_id_demo,
      qr_token: passport?.qr_token ?? `HN${patientId.slice(-8).toUpperCase()}`,
      photo_initials: initials(profile.full_name),
      conditions: patient.chronic_diseases,
      allergies: passport?.allergies ?? patient.allergies,
      medicines: passport?.current_medicines?.length
        ? passport.current_medicines
        : meds,
      doctor: doctor
        ? {
            name: doctorProfile?.full_name ?? "Clinician",
            specialty: doctor.specialty,
            phone: doctorProfile?.phone ?? null,
            hospital,
          }
        : null,
      hospital_name: hospital,
      emergency_contact:
        passport?.emergency_contacts ?? patient.emergency_contact,
      recovery_score: health.recovery.recovery_score,
      readmission_risk: health.readmission.risk_category,
      last_checkin_at: checkins[0]?.recorded_at ?? null,
      next_appointment_at: nextAppt?.scheduled_at ?? null,
      next_appointment_location: nextAppt?.location ?? null,
      emergency_status,
      medical_history: passport?.medical_history ?? patient.medical_history,
      address_city:
        (patient.address?.city as string | undefined) ||
        (profile.address?.city as string | undefined) ||
        null,
    };
  },

  getEmergencyProfile(token: string): EmergencyProfile | null {
    const store = getStore();
    const passport = store.passports.find(
      (p) => p.qr_token.toLowerCase() === token.toLowerCase(),
    );
    const patientId = passport?.patient_id;
    if (!patientId && token.toUpperCase().includes("DEMO")) {
      return this.getEmergencyProfileByPatient(IDS.patient);
    }
    if (!patientId) {
      // Also allow patient id suffix tokens
      const byPatient = store.patients.find((p) =>
        token.toUpperCase().includes(p.id.slice(-8).toUpperCase()),
      );
      if (!byPatient) return null;
      return this.getEmergencyProfileByPatient(byPatient.id);
    }
    return this.getEmergencyProfileByPatient(patientId);
  },

  getEmergencyProfileByPatient(patientId: string): EmergencyProfile {
    const passport = this.getDigitalPassport(patientId);
    if (!passport) {
      return {
        token: "",
        full_name: "Unknown patient",
        blood_group: null,
        allergies: [],
        medicines: [],
        emergency_contact: null,
        doctor: null,
        disclaimer:
          "Emergency Medical Profile — assistive information only. Not a diagnosis. Seek urgent care for red-flag symptoms.",
      };
    }
    return {
      token: passport.qr_token,
      full_name: passport.full_name,
      blood_group: passport.blood_group,
      allergies: passport.allergies,
      medicines: passport.medicines.map((m) => ({
        name: m.name,
        dose: m.dose,
      })),
      emergency_contact: passport.emergency_contact,
      doctor: passport.doctor
        ? {
            name: passport.doctor.name,
            phone: passport.doctor.phone,
            hospital: passport.doctor.hospital,
          }
        : null,
      disclaimer:
        "Emergency Medical Profile — assistive information only. Not a diagnosis. Seek urgent care for red-flag symptoms.",
    };
  },

  emergencyQrUrl(token: string): string {
    if (typeof window === "undefined") return `/emergency/${token}`;
    return `${window.location.origin}/emergency/${encodeURIComponent(token)}`;
  },

  getTimeline(userOrPatientId: string): TimelineEvent[] {
    const store = getStore();
    const patientId = resolvePatientId(userOrPatientId);
    const events: TimelineEvent[] = [];

    for (const d of store.discharges.filter((x) => x.patient_id === patientId)) {
      if (d.discharge_date || d.finalized_at) {
        events.push({
          id: `${d.id}-discharge`,
          kind: "discharge",
          title: "Hospital Discharge",
          summary: d.diagnosis_text || "Discharge summarized",
          at: d.finalized_at || d.discharge_date || d.created_at,
          meta: d.hospital_name,
        });
      }
      events.push({
        id: `${d.id}-admit`,
        kind: "admission",
        title: "Hospital Admission",
        summary: d.diagnosis_text || "Admission recorded",
        at: d.created_at,
        meta: d.hospital_name,
      });
    }

    for (const m of store.medicines.filter(
      (x) => x.patient_id === patientId && x.active,
    )) {
      events.push({
        id: `med-${m.id}`,
        kind: "medicine",
        title: m.name,
        summary: [m.dose, m.frequency].filter(Boolean).join(" · "),
        at: new Date().toISOString(),
        meta: "Current medicine",
      });
    }

    for (const c of store.checkins.filter((x) => x.patient_id === patientId)) {
      events.push({
        id: c.id,
        kind: "checkin",
        title: "Daily Check-in",
        summary: `Sugar ${c.blood_sugar ?? "—"} · BP ${c.bp_systolic ?? "—"}/${c.bp_diastolic ?? "—"}`,
        at: c.recorded_at,
      });
    }

    for (const a of store.appointments.filter(
      (x) => x.patient_id === patientId,
    )) {
      events.push({
        id: a.id,
        kind: "appointment",
        title: `${a.appointment_type.replaceAll("_", " ")} · ${a.doctor_name}`,
        summary: a.location || a.status,
        at: a.scheduled_at,
        meta: a.status,
      });
    }

    for (const r of (store.healthRecords ?? []).filter(
      (x) => x.patient_id === patientId,
    )) {
      const kind: TimelineEvent["kind"] =
        r.category === "lab_report"
          ? "report"
          : r.category === "vaccination"
            ? "vaccination"
            : r.category === "doctor_note"
              ? "note"
              : r.category === "hospital_visit"
                ? "admission"
                : r.category === "prescription"
                  ? "medicine"
                  : "note";
      events.push({
        id: r.id,
        kind,
        title: r.title,
        summary: r.summary,
        at: r.recorded_at,
        meta: r.facility || r.source,
      });
    }

    return events.sort((a, b) => b.at.localeCompare(a.at));
  },

  listHealthRecords(userOrPatientId: string): HealthRecordRow[] {
    const patientId = resolvePatientId(userOrPatientId);
    return (getStore().healthRecords ?? [])
      .filter((r) => r.patient_id === patientId)
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  },

  getBenefitsDashboard(userOrPatientId: string): BenefitsDashboard {
    const patientId = resolvePatientId(userOrPatientId);
    const gov = ensureGov(patientId);
    const records = this.listHealthRecords(patientId);
    const counts = {} as Record<HealthRecordCategory, number>;
    for (const r of records) {
      counts[r.category] = (counts[r.category] ?? 0) + 1;
    }

    return {
      abha_id: gov.abha_id,
      abha_linked: gov.abha_linked,
      abha_linked_at: gov.abha_linked_at,
      pmjay_status: gov.pmjay_status,
      pmjay_confidence: gov.pmjay_confidence,
      linked_record_count: records.length,
      schemes: [
        {
          name: "Ayushman Bharat PM-JAY",
          status:
            gov.pmjay_status === "likely_eligible"
              ? "Likely eligible (demo)"
              : gov.pmjay_status === "needs_review"
                ? "Needs review"
                : "Not assessed",
          detail: "National health assurance scheme — verify at hospital desk",
        },
        {
          name: "ABHA Health ID",
          status: gov.abha_linked ? "Linked (demo)" : "Available to link",
          detail: "Digital health identity for ABDM-compatible records",
        },
      ],
      documents: [
        { name: "Aadhaar / Photo ID", required: true, ready: true },
        { name: "Ayushman Card", required: false, ready: false },
        { name: "Ration / Income proof", required: false, ready: false },
        {
          name: "Recent discharge summary",
          required: false,
          ready: Boolean(
            getStore().discharges.find(
              (d) => d.patient_id === patientId && d.status === "finalized",
            ),
          ),
        },
      ],
      records_by_category: counts,
    };
  },

  async importAbhaRecords(userOrPatientId: string, abhaId: string) {
    const patientId = resolvePatientId(userOrPatientId);
    await wait(900);
    const bundle = fetchDemoAbhaBundle(abhaId);
    await wait(1100);
    const rows = bundleToHealthRecords(patientId, bundle);

    updateStore((draft) => {
      draft.healthRecords = draft.healthRecords ?? [];
      // Replace previous abha_demo rows for this patient
      draft.healthRecords = draft.healthRecords.filter(
        (r) => !(r.patient_id === patientId && r.source === "abha_demo"),
      );
      draft.healthRecords.push(...rows);

      const patient = draft.patients.find((p) => p.id === patientId);
      if (patient) {
        patient.abha_id_demo = bundle.abha_id;
        const allergies = new Set([
          ...patient.allergies,
          ...bundle.allergies,
        ]);
        patient.allergies = [...allergies];
        const conditions = new Set([
          ...patient.chronic_diseases,
          ...bundle.chronic_diseases,
        ]);
        patient.chronic_diseases = [...conditions];
      }

      const passport = draft.passports.find((p) => p.patient_id === patientId);
      if (passport) {
        passport.abha_id_demo = bundle.abha_id;
        passport.allergies = [
          ...new Set([...passport.allergies, ...bundle.allergies]),
        ];
      }

      draft.governmentProfiles = draft.governmentProfiles ?? [];
      let gov = draft.governmentProfiles.find((g) => g.patient_id === patientId);
      if (!gov) {
        gov = {
          patient_id: patientId,
          abha_id: bundle.abha_id,
          abha_linked: true,
          abha_linked_at: new Date().toISOString(),
          pmjay_status: "unknown",
          pmjay_confidence: 0,
          pmjay_answers: {},
          pmjay_assessed_at: null,
          linked_record_count: rows.length,
        };
        draft.governmentProfiles.push(gov);
      } else {
        gov.abha_id = bundle.abha_id;
        gov.abha_linked = true;
        gov.abha_linked_at = new Date().toISOString();
        gov.linked_record_count = draft.healthRecords.filter(
          (r) => r.patient_id === patientId,
        ).length;
      }
    });

    return {
      bundle,
      records: this.listHealthRecords(patientId),
    };
  },

  savePmjayAssessment(userOrPatientId: string, answers: PmjayWizardAnswers) {
    const patientId = resolvePatientId(userOrPatientId);
    const result = assessPmjayEligibility(answers);
    updateStore((draft) => {
      draft.governmentProfiles = draft.governmentProfiles ?? [];
      let gov = draft.governmentProfiles.find((g) => g.patient_id === patientId);
      if (!gov) {
        const patient = draft.patients.find((p) => p.id === patientId);
        gov = {
          patient_id: patientId,
          abha_id: patient?.abha_id_demo ?? null,
          abha_linked: false,
          abha_linked_at: null,
          pmjay_status: "unknown",
          pmjay_confidence: 0,
          pmjay_answers: {},
          pmjay_assessed_at: null,
          linked_record_count: (draft.healthRecords ?? []).filter(
            (r) => r.patient_id === patientId,
          ).length,
        };
        draft.governmentProfiles.push(gov);
      }
      gov.pmjay_status = result.status;
      gov.pmjay_confidence = result.confidence;
      gov.pmjay_answers = { ...answers };
      gov.pmjay_assessed_at = new Date().toISOString();
    });
    return result;
  },

  nearestEmergencyHospital() {
    return (
      AHMEDABAD_DEMO_HOSPITALS.find((h) => h.is_emergency) ??
      AHMEDABAD_DEMO_HOSPITALS[0]!
    );
  },

  ensureQrToken(userOrPatientId: string): string {
    const patientId = resolvePatientId(userOrPatientId);
    const store = getStore();
    const existing = store.passports.find((p) => p.patient_id === patientId);
    if (existing?.qr_token) return existing.qr_token;
    const token = `HN${newId().slice(0, 8).toUpperCase()}`;
    updateStore((draft) => {
      const patient = draft.patients.find((p) => p.id === patientId);
      draft.passports.push({
        patient_id: patientId,
        qr_token: token,
        abha_id_demo: patient?.abha_id_demo ?? null,
        allergies: patient?.allergies ?? [],
        medical_history: patient?.medical_history ?? null,
        emergency_contacts: patient?.emergency_contact ?? null,
        current_medicines: [],
        blood_group: patient?.blood_group ?? null,
      });
    });
    return token;
  },
};

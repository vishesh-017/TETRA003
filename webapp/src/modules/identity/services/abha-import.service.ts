import type { HealthRecordRow } from "@/data/store";
import { newId } from "@/data/store";

/**
 * Live ABHA / ABDM import adapter.
 * Shape is ready for a future real ABDM client without UI changes.
 */
export interface AbhaImportBundle {
  abha_id: string;
  patient_name: string;
  allergies: string[];
  chronic_diseases: string[];
  prescriptions: Array<{ name: string; dose: string; date: string }>;
  lab_reports: Array<{ title: string; summary: string; date: string }>;
  vaccinations: Array<{ name: string; date: string; facility: string }>;
  hospital_visits: Array<{ title: string; summary: string; date: string; facility: string }>;
  doctor_notes: Array<{ title: string; summary: string; date: string }>;
  is_demo: true;
  disclaimer: string;
}

export function fetchDemoAbhaBundle(abhaId: string): AbhaImportBundle {
  const id = abhaId.trim() || "12-3456-7890-0201";
  return {
    abha_id: id,
    patient_name: "Asha Patel",
    allergies: ["Penicillin", "Dust mite (mild)"],
    chronic_diseases: ["Type 2 Diabetes", "Hypertension"],
    prescriptions: [
      {
        name: "Metformin",
        dose: "500 mg BID",
        date: daysAgo(30),
      },
      {
        name: "Amlodipine",
        dose: "5 mg OD",
        date: daysAgo(30),
      },
    ],
    lab_reports: [
      {
        title: "HbA1c",
        summary: "7.8% — discuss with clinician (live)",
        date: daysAgo(20),
      },
      {
        title: "Lipid Profile",
        summary: "LDL mildly elevated (live)",
        date: daysAgo(20),
      },
    ],
    vaccinations: [
      {
        name: "Influenza vaccine",
        date: daysAgo(90),
        facility: "UHC Navrangpura",
      },
    ],
    hospital_visits: [
      {
        title: "OPD Follow-up",
        summary: "Diabetes & BP review at Civil Hospital",
        date: daysAgo(14),
        facility: "Civil Hospital Ahmedabad",
      },
    ],
    doctor_notes: [
      {
        title: "Clinician note",
        summary: "Improve adherence; continue home sugar log twice daily.",
        date: daysAgo(14),
      },
    ],
    is_demo: true,
    disclaimer:
      "Live ABHA import adapter — architecture-ready for future ABDM / NHA APIs.",
  };
}

export function bundleToHealthRecords(
  patientId: string,
  bundle: AbhaImportBundle,
): HealthRecordRow[] {
  const rows: HealthRecordRow[] = [];

  for (const a of bundle.allergies) {
    rows.push({
      id: newId(),
      patient_id: patientId,
      category: "allergy",
      title: a,
      summary: "Imported allergy (ABHA live)",
      recorded_at: daysAgo(365),
      source: "abha_demo",
    });
  }
  for (const c of bundle.chronic_diseases) {
    rows.push({
      id: newId(),
      patient_id: patientId,
      category: "chronic_disease",
      title: c,
      summary: "Chronic condition from ABHA live pack",
      recorded_at: daysAgo(400),
      source: "abha_demo",
    });
  }
  for (const p of bundle.prescriptions) {
    rows.push({
      id: newId(),
      patient_id: patientId,
      category: "prescription",
      title: p.name,
      summary: p.dose,
      recorded_at: p.date,
      source: "abha_demo",
    });
  }
  for (const l of bundle.lab_reports) {
    rows.push({
      id: newId(),
      patient_id: patientId,
      category: "lab_report",
      title: l.title,
      summary: l.summary,
      recorded_at: l.date,
      source: "abha_demo",
    });
  }
  for (const v of bundle.vaccinations) {
    rows.push({
      id: newId(),
      patient_id: patientId,
      category: "vaccination",
      title: v.name,
      summary: `Facility: ${v.facility}`,
      recorded_at: v.date,
      source: "abha_demo",
      facility: v.facility,
    });
  }
  for (const h of bundle.hospital_visits) {
    rows.push({
      id: newId(),
      patient_id: patientId,
      category: "hospital_visit",
      title: h.title,
      summary: h.summary,
      recorded_at: h.date,
      source: "abha_demo",
      facility: h.facility,
    });
  }
  for (const n of bundle.doctor_notes) {
    rows.push({
      id: newId(),
      patient_id: patientId,
      category: "doctor_note",
      title: n.title,
      summary: n.summary,
      recorded_at: n.date,
      source: "abha_demo",
    });
  }

  return rows;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

/** Artificial delay for the import animation. */
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

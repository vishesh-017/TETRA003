import { getStore, IDS, newId, updateStore } from "@/data/store";
import type { ClinicalReportRow } from "@/data/store/types";
import { saveAttachmentFromFile } from "@/lib/attachment-store";

function doctorForUser(userId: string) {
  const store = getStore();
  return (
    store.doctors.find((d) => d.user_id === userId) ||
    store.doctors.find((d) => d.id === IDS.doctor)!
  );
}

function patientIdForUser(userId: string): string {
  const store = getStore();
  const patient = store.patients.find((p) => p.user_id === userId);
  if (!patient) throw new Error("Patient profile not found");
  return patient.id;
}

function toView(row: ClinicalReportRow) {
  const store = getStore();
  const patient = store.patients.find((p) => p.id === row.patient_id);
  const profile = patient
    ? store.profiles.find((p) => p.id === patient.user_id)
    : undefined;
  const doctor = row.doctor_id
    ? store.doctors.find((d) => d.id === row.doctor_id)
    : null;
  const doctorProfile = doctor
    ? store.profiles.find((p) => p.id === doctor.user_id)
    : null;
  return {
    ...row,
    patient_name: profile?.full_name ?? "Patient",
    doctor_name: doctorProfile?.full_name ?? null,
  };
}

export function listDoctorsForPatient(userId: string) {
  const patientId = patientIdForUser(userId);
  const store = getStore();
  return store.relationships
    .filter((r) => r.patient_id === patientId && r.status === "active")
    .map((r) => {
      const doctor = store.doctors.find((d) => d.id === r.doctor_id);
      const profile = doctor
        ? store.profiles.find((p) => p.id === doctor.user_id)
        : null;
      return {
        id: r.doctor_id,
        name: profile?.full_name || "Doctor",
        specialty: doctor?.specialty || "",
        hospital: doctor?.hospital_affiliation || "",
      };
    });
}

export const reportsRepository = {
  listForPatient(userId: string) {
    const patientId = patientIdForUser(userId);
    return getStore()
      .clinicalReports.filter((r) => r.patient_id === patientId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(toView);
  },

  listForDoctor(userId: string) {
    const doctor = doctorForUser(userId);
    const patientIds = new Set(
      getStore()
        .relationships.filter(
          (r) => r.doctor_id === doctor.id && r.status === "active",
        )
        .map((r) => r.patient_id),
    );
    return getStore()
      .clinicalReports.filter(
        (r) => r.doctor_id === doctor.id || patientIds.has(r.patient_id),
      )
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(toView);
  },

  async upload(
    userId: string,
    input: {
      title: string;
      report_type: string;
      notes?: string;
      file?: File | null;
      doctorId?: string | null;
    },
  ) {
    if (!input.file) throw new Error("Please choose a PDF or image file");
    const patientId = patientIdForUser(userId);
    const store = getStore();
    const doctors = listDoctorsForPatient(userId);
    const doctorId =
      input.doctorId ||
      doctors[0]?.id ||
      store.relationships.find(
        (r) => r.patient_id === patientId && r.status === "active",
      )?.doctor_id ||
      null;
    if (!doctorId) throw new Error("Select a doctor to send this report to");

    const id = newId();
    const attachmentRef = await saveAttachmentFromFile(
      `report-${id}`,
      input.file,
    );
    const now = new Date().toISOString();

    updateStore((draft) => {
      draft.clinicalReports.unshift({
        id,
        patient_id: patientId,
        doctor_id: doctorId,
        title: input.title.trim() || "Clinical report",
        report_type: input.report_type || "lab",
        notes: input.notes?.trim() || null,
        attachment_name: input.file!.name,
        attachment_url: attachmentRef,
        attachment_mime: input.file!.type || "application/pdf",
        doctor_feedback: null,
        feedback_at: null,
        status: "uploaded",
        created_at: now,
        updated_at: now,
      });
      draft.healthRecords.unshift({
        id: newId(),
        patient_id: patientId,
        category: "lab_report",
        title: input.title.trim() || "Clinical report",
        summary: input.notes?.trim() || "Patient uploaded a report",
        recorded_at: now,
        source: "local",
        facility: null,
        metadata: { clinical_report_id: id },
      });
      const doctor = draft.doctors.find((d) => d.id === doctorId);
      if (doctor) {
        draft.notifications.unshift({
          id: newId(),
          user_id: doctor.user_id,
          type: "investigation",
          title: "New patient report uploaded",
          body: `${draft.profiles.find((p) => p.id === userId)?.full_name || "Patient"} uploaded: ${input.title}`,
          read: false,
          created_at: now,
        });
      }
    });
    return toView(getStore().clinicalReports.find((r) => r.id === id)!);
  },

  feedback(doctorUserId: string, reportId: string, feedback: string) {
    const doctor = doctorForUser(doctorUserId);
    const now = new Date().toISOString();
    updateStore((draft) => {
      const row = draft.clinicalReports.find((r) => r.id === reportId);
      if (!row) throw new Error("Report not found");
      row.doctor_feedback = feedback.trim();
      row.feedback_at = now;
      row.status = "reviewed";
      row.updated_at = now;
      row.doctor_id = doctor.id;
      const patient = draft.patients.find((p) => p.id === row.patient_id);
      if (patient) {
        draft.notifications.unshift({
          id: newId(),
          user_id: patient.user_id,
          type: "doctor_message",
          title: "Doctor feedback on your report",
          body: feedback.trim().slice(0, 180),
          read: false,
          created_at: now,
        });
      }
    });
    return toView(getStore().clinicalReports.find((r) => r.id === reportId)!);
  },
};

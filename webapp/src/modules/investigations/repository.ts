import {
  getStore,
  newId,
  todayKey,
  updateStore,
  type InvestigationPriority,
  type InvestigationRow,
  type InvestigationStatus,
} from "@/data/store";
import { env } from "@/config/env";
import { getSupabaseClient } from "@/lib/supabase";

import type {
  InvestigationComplianceStats,
  InvestigationDraftInput,
  InvestigationQueueFilter,
  InvestigationView,
} from "./types";

function daysUntil(due: string): number {
  const today = new Date(`${todayKey()}T00:00:00`);
  const target = new Date(`${due.slice(0, 10)}T00:00:00`);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function patientName(patientId: string): string {
  const store = getStore();
  const patient = store.patients.find((p) => p.id === patientId);
  const profile = store.profiles.find((p) => p.id === patient?.user_id);
  return profile?.full_name || "Patient";
}

function mapView(row: InvestigationRow): InvestigationView {
  return {
    ...row,
    patient_name: patientName(row.patient_id),
    days_until_due: daysUntil(row.due_date),
  };
}

function effectiveStatus(row: InvestigationRow): InvestigationStatus {
  if (
    row.status === "completed" ||
    row.status === "cancelled" ||
    row.status === "review_required"
  ) {
    return row.status;
  }
  if (daysUntil(row.due_date) < 0) return "overdue";
  return row.status;
}

function pushNotification(
  userId: string,
  title: string,
  body: string,
  createdAt = new Date().toISOString(),
) {
  updateStore((draft) => {
    draft.notifications.unshift({
      id: newId(),
      user_id: userId,
      type: "investigation",
      title,
      body,
      read: false,
      created_at: createdAt,
    });
  });
}

async function persistInvestigation(row: InvestigationRow) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  try {
    await supabase.from("investigations").upsert({
      id: row.id,
      patient_id: row.patient_id,
      doctor_id: row.doctor_id,
      discharge_id: row.discharge_id,
      name: row.name,
      purpose: row.purpose,
      due_date: row.due_date,
      priority: row.priority,
      notes: row.notes,
      status: row.status,
      preparation: row.preparation,
      completed_at: row.completed_at,
      reviewed_at: row.reviewed_at,
      reviewed_by: row.reviewed_by,
      attachment_url: row.attachment_url,
      attachment_name: row.attachment_name,
      attachment_mime: row.attachment_mime,
      reminder_sent_at: row.reminder_sent_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  } catch {
    // Local store remains source of truth for demo.
  }
}

async function uploadAttachmentBlob(
  patientId: string,
  investigationId: string,
  file: File,
): Promise<{ url: string; name: string; mime: string }> {
  const supabase = getSupabaseClient();
  if (supabase && env.isSupabaseConfigured) {
    const path = `${patientId}/${investigationId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("investigation-reports")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (!error) {
      const { data } = supabase.storage
        .from("investigation-reports")
        .getPublicUrl(path);
      if (data?.publicUrl) {
        return { url: data.publicUrl, name: file.name, mime: file.type };
      }
    }
  }

  // Demo fallback: data URL preview (no OCR).
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
  return { url: dataUrl, name: file.name, mime: file.type || "application/octet-stream" };
}

function notifyCaregivers(patientId: string, title: string, body: string) {
  const store = getStore();
  const caregivers = store.caregiverArrangements.filter(
    (a) => a.patient_id === patientId && a.status === "active",
  );
  for (const cg of caregivers) {
    pushNotification(cg.caregiver_user_id, title, body);
  }
}

export const investigationRepository = {
  syncOverdueStatuses() {
    const now = new Date().toISOString();
    updateStore((draft) => {
      for (const row of draft.investigations) {
        if (
          (row.status === "pending" || row.status === "scheduled") &&
          daysUntil(row.due_date) < 0
        ) {
          row.status = "overdue";
          row.updated_at = now;
        }
      }
    });
  },

  listForPatient(patientId: string): InvestigationView[] {
    this.syncOverdueStatuses();
    return getStore()
      .investigations.filter((i) => i.patient_id === patientId)
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
      .map((row) => mapView({ ...row, status: effectiveStatus(row) }));
  },

  listForDoctor(
    doctorId: string,
    filter: InvestigationQueueFilter = "all",
  ): InvestigationView[] {
    this.syncOverdueStatuses();
    let rows = getStore()
      .investigations.filter((i) => i.doctor_id === doctorId)
      .map((row) => mapView({ ...row, status: effectiveStatus(row) }));

    if (filter === "pending") {
      rows = rows.filter(
        (r) => r.status === "pending" || r.status === "scheduled",
      );
    } else if (filter === "completed") {
      rows = rows.filter((r) => r.status === "completed");
    } else if (filter === "overdue") {
      rows = rows.filter((r) => r.status === "overdue");
    } else if (filter === "high_priority") {
      rows = rows.filter(
        (r) =>
          (r.priority === "urgent" || r.priority === "important") &&
          r.status !== "completed" &&
          r.status !== "cancelled",
      );
    } else if (filter === "review_required") {
      rows = rows.filter((r) => r.status === "review_required");
    }

    return rows.sort((a, b) => {
      const rank: Record<string, number> = {
        overdue: 0,
        review_required: 1,
        pending: 2,
        scheduled: 3,
        completed: 4,
        cancelled: 5,
      };
      return (
        (rank[a.status] ?? 9) - (rank[b.status] ?? 9) ||
        a.due_date.localeCompare(b.due_date)
      );
    });
  },

  complianceStats(doctorId?: string): InvestigationComplianceStats {
    this.syncOverdueStatuses();
    const rows = getStore()
      .investigations.filter((i) => !doctorId || i.doctor_id === doctorId)
      .map((r) => ({ ...r, status: effectiveStatus(r) }));
    const total = rows.length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const overdue = rows.filter((r) => r.status === "overdue").length;
    const pending = rows.filter(
      (r) => r.status === "pending" || r.status === "scheduled",
    ).length;
    const scheduled = rows.filter((r) => r.status === "scheduled").length;
    const review_required = rows.filter(
      (r) => r.status === "review_required",
    ).length;
    return {
      total,
      pending,
      scheduled,
      completed,
      overdue,
      review_required,
      compliance_rate: total
        ? Math.round((completed / total) * 100)
        : 100,
    };
  },

  replaceForDischarge(
    patientId: string,
    doctorId: string,
    dischargeId: string,
    items: InvestigationDraftInput[],
  ): InvestigationView[] {
    const now = new Date().toISOString();
    updateStore((draft) => {
      draft.investigations = draft.investigations.filter(
        (i) =>
          !(
            i.discharge_id === dischargeId &&
            (i.status === "pending" || i.status === "scheduled")
          ),
      );
      for (const item of items) {
        if (!item.name.trim() || !item.due_date) continue;
        draft.investigations.unshift({
          id: newId(),
          patient_id: patientId,
          doctor_id: doctorId,
          discharge_id: dischargeId,
          name: item.name.trim(),
          purpose: item.purpose?.trim() || null,
          due_date: item.due_date.slice(0, 10),
          priority: item.priority || "routine",
          notes: item.notes?.trim() || null,
          status: "pending",
          preparation: item.preparation?.trim() || null,
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
      }
    });
    return this.listForPatient(patientId).filter(
      (i) => i.discharge_id === dischargeId,
    );
  },

  /** Activate + notify when discharge is finalized. */
  activateForDischarge(dischargeId: string) {
    const store = getStore();
    const rows = store.investigations.filter(
      (i) => i.discharge_id === dischargeId,
    );
    if (!rows.length) return;

    const patient = store.patients.find((p) => p.id === rows[0]!.patient_id);
    const name = patientName(rows[0]!.patient_id);
    const now = new Date().toISOString();

    updateStore((draft) => {
      for (const row of draft.investigations) {
        if (row.discharge_id !== dischargeId) continue;
        if (row.status === "cancelled" || row.status === "completed") continue;
        row.status = "pending";
        row.updated_at = now;
        draft.healthRecords.unshift({
          id: newId(),
          patient_id: row.patient_id,
          category: "lab_report",
          title: `Investigation assigned: ${row.name}`,
          summary: [
            row.purpose,
            `Due ${row.due_date}`,
            row.notes,
          ]
            .filter(Boolean)
            .join(" · "),
          recorded_at: now,
          source: "local",
          facility: null,
          metadata: {
            investigation_id: row.id,
            event: "assigned",
            priority: row.priority,
          },
        });
      }
    });

    if (patient) {
      pushNotification(
        patient.user_id,
        "Investigations prescribed",
        `${rows.length} investigation(s) were added to your recovery plan. Check Pending Investigations.`,
        now,
      );
    }
    notifyCaregivers(
      rows[0]!.patient_id,
      "Investigations to support",
      `${name} has ${rows.length} prescribed investigation(s) after discharge.`,
    );

    for (const row of this.listForPatient(rows[0]!.patient_id).filter(
      (i) => i.discharge_id === dischargeId,
    )) {
      void persistInvestigation(
        getStore().investigations.find((i) => i.id === row.id)!,
      );
    }
  },

  sendDueReminders() {
    this.syncOverdueStatuses();
    const store = getStore();
    const now = new Date().toISOString();

    for (const row of store.investigations) {
      const status = effectiveStatus(row);
      const until = daysUntil(row.due_date);
      const patient = store.patients.find((p) => p.id === row.patient_id);
      if (!patient) continue;

      if (
        (status === "pending" || status === "scheduled") &&
        until === 1 &&
        !row.reminder_sent_at
      ) {
        pushNotification(
          patient.user_id,
          "Investigation due tomorrow",
          `${row.name} is due tomorrow. Please complete it as advised by your doctor.`,
          now,
        );
        notifyCaregivers(
          row.patient_id,
          "Investigation due tomorrow",
          `${patientName(row.patient_id)} should complete ${row.name} tomorrow.`,
        );
        updateStore((draft) => {
          const target = draft.investigations.find((i) => i.id === row.id);
          if (target) {
            target.reminder_sent_at = now;
            target.updated_at = now;
            draft.healthRecords.unshift({
              id: newId(),
              patient_id: row.patient_id,
              category: "lab_report",
              title: `Reminder sent: ${row.name}`,
              summary: "Patient and caregiver notified about upcoming investigation.",
              recorded_at: now,
              source: "local",
              facility: null,
              metadata: { investigation_id: row.id, event: "reminder" },
            });
          }
        });
      }

      if (status === "overdue") {
        const doctor = store.doctors.find((d) => d.id === row.doctor_id);
        const already = store.notifications.some(
          (n) =>
            n.type === "investigation" &&
            n.title.includes("overdue") &&
            n.body.includes(row.name) &&
            n.created_at.slice(0, 10) === todayKey(),
        );
        if (!already && doctor) {
          pushNotification(
            doctor.user_id,
            "Investigation overdue",
            `${patientName(row.patient_id)} — ${row.name} is overdue (due ${row.due_date}).`,
            now,
          );
          notifyCaregivers(
            row.patient_id,
            "Patient has not completed investigation",
            `${row.name} for ${patientName(row.patient_id)} is overdue. Please help them complete it.`,
          );
          if (patient) {
            pushNotification(
              patient.user_id,
              "Investigation overdue",
              `${row.name} is past its due date. Complete it and update HealNexus.`,
              now,
            );
          }
        }
      }
    }
  },

  async markCompleted(
    investigationId: string,
    opts?: { notes?: string },
  ): Promise<InvestigationView> {
    const now = new Date().toISOString();
    updateStore((draft) => {
      const row = draft.investigations.find((i) => i.id === investigationId);
      if (!row) throw new Error("Investigation not found");
      row.status = "review_required";
      row.completed_at = now;
      row.updated_at = now;
      if (opts?.notes) row.notes = opts.notes;
      draft.healthRecords.unshift({
        id: newId(),
        patient_id: row.patient_id,
        category: "lab_report",
        title: `Investigation completed: ${row.name}`,
        summary: "Patient marked investigation complete — awaiting doctor review.",
        recorded_at: now,
        source: "local",
        facility: null,
        metadata: { investigation_id: row.id, event: "completed" },
      });
    });

    const row = getStore().investigations.find((i) => i.id === investigationId)!;
    const doctor = getStore().doctors.find((d) => d.id === row.doctor_id);
    if (doctor) {
      pushNotification(
        doctor.user_id,
        "Investigation ready for review",
        `${patientName(row.patient_id)} completed ${row.name}.`,
        now,
      );
    }
    notifyCaregivers(
      row.patient_id,
      "Investigation completed",
      `${patientName(row.patient_id)} marked ${row.name} complete — awaiting doctor review.`,
    );
    await persistInvestigation(row);
    return mapView(row);
  },

  async uploadReport(
    investigationId: string,
    file: File,
  ): Promise<InvestigationView> {
    const existing = getStore().investigations.find(
      (i) => i.id === investigationId,
    );
    if (!existing) throw new Error("Investigation not found");

    const uploaded = await uploadAttachmentBlob(
      existing.patient_id,
      investigationId,
      file,
    );
    const now = new Date().toISOString();

    updateStore((draft) => {
      const row = draft.investigations.find((i) => i.id === investigationId);
      if (!row) throw new Error("Investigation not found");
      row.attachment_url = uploaded.url;
      row.attachment_name = uploaded.name;
      row.attachment_mime = uploaded.mime;
      row.status =
        row.status === "completed" ? "review_required" : "review_required";
      row.completed_at = row.completed_at || now;
      row.updated_at = now;
      draft.healthRecords.unshift({
        id: newId(),
        patient_id: row.patient_id,
        category: "lab_report",
        title: `Report uploaded: ${row.name}`,
        summary: uploaded.name,
        recorded_at: now,
        source: "local",
        facility: null,
        metadata: {
          investigation_id: row.id,
          event: "report_uploaded",
          attachment_url: uploaded.url,
        },
      });
    });

    const row = getStore().investigations.find((i) => i.id === investigationId)!;
    const doctor = getStore().doctors.find((d) => d.id === row.doctor_id);
    if (doctor) {
      pushNotification(
        doctor.user_id,
        "Investigation report uploaded",
        `${patientName(row.patient_id)} uploaded a report for ${row.name}.`,
        now,
      );
    }
    await persistInvestigation(row);
    return mapView(row);
  },

  review(
    investigationId: string,
    doctorUserId: string,
    decision: "completed" | "cancelled" = "completed",
  ): InvestigationView {
    const now = new Date().toISOString();
    updateStore((draft) => {
      const row = draft.investigations.find((i) => i.id === investigationId);
      if (!row) throw new Error("Investigation not found");
      row.status = decision;
      row.reviewed_at = now;
      row.reviewed_by = doctorUserId;
      row.updated_at = now;
      if (decision === "completed" && !row.completed_at) {
        row.completed_at = now;
      }
      draft.healthRecords.unshift({
        id: newId(),
        patient_id: row.patient_id,
        category: "doctor_note",
        title: `Doctor reviewed: ${row.name}`,
        summary:
          decision === "completed"
            ? "Doctor marked investigation complete. AI does not interpret results."
            : "Investigation cancelled by doctor.",
        recorded_at: now,
        source: "local",
        facility: null,
        metadata: { investigation_id: row.id, event: "reviewed" },
      });
    });

    const row = getStore().investigations.find((i) => i.id === investigationId)!;
    const patient = getStore().patients.find((p) => p.id === row.patient_id);
    if (patient && decision === "completed") {
      pushNotification(
        patient.user_id,
        "Investigation reviewed",
        `Your doctor reviewed ${row.name}. Continue your recovery plan.`,
        now,
      );
      notifyCaregivers(
        row.patient_id,
        "Investigation reviewed",
        `Doctor reviewed ${row.name} for ${patientName(row.patient_id)}.`,
      );
    }
    void persistInvestigation(row);
    return mapView(row);
  },

  updateStatus(
    investigationId: string,
    status: InvestigationStatus,
  ): InvestigationView {
    const now = new Date().toISOString();
    updateStore((draft) => {
      const row = draft.investigations.find((i) => i.id === investigationId);
      if (!row) throw new Error("Investigation not found");
      row.status = status;
      row.updated_at = now;
    });
    const row = getStore().investigations.find((i) => i.id === investigationId)!;
    void persistInvestigation(row);
    return mapView(row);
  },

  textSummaryForPatient(patientId: string): string {
    const open = this.listForPatient(patientId).filter(
      (i) =>
        i.status === "pending" ||
        i.status === "scheduled" ||
        i.status === "overdue" ||
        i.status === "review_required",
    );
    if (!open.length) return "";
    return open
      .map(
        (i) =>
          `${i.name} (due ${i.due_date}, ${i.priority})${
            i.preparation ? ` — Prep: ${i.preparation}` : ""
          }`,
      )
      .join("\n");
  },

  createDraftRow(
    input: InvestigationDraftInput & {
      priority?: InvestigationPriority;
    },
  ): InvestigationDraftInput {
    return {
      name: input.name,
      purpose: input.purpose ?? null,
      due_date: input.due_date,
      priority: input.priority || "routine",
      notes: input.notes ?? null,
      preparation: input.preparation ?? null,
    };
  },
};

/**
 * Sync engine: IndexedDB → HealNexus dynamic store (+ optional Supabase).
 * Conflict policy: last-write-wins by captured_at / updated_at.
 * Never deletes local records on failure — marks failed for retry.
 */

import { env } from "@/config/env";
import {
  getStore,
  IDS,
  newId,
  updateStore,
  type RiskLevel,
} from "@/data/store";
import { getSupabaseClient } from "@/lib/supabase";
import {
  countPendingSync,
  listNotifications,
  listScreenings,
  markNotification,
  updateScreening,
} from "@/modules/rural/offline/storage";
import { isOnline } from "@/modules/rural/offline/online";
import { ruralRepository } from "@/modules/rural/repository";
import type { RuralScreeningRecord, SyncSummary } from "@/modules/rural/types";

export { isOnline };

function resolvePatientId(screening: RuralScreeningRecord): string {
  if (screening.patient_id) {
    const exists = getStore().patients.some((p) => p.id === screening.patient_id);
    if (exists) return screening.patient_id;
  }
  const byName = getStore().patients.find((p) => {
    const profile = getStore().profiles.find((x) => x.id === p.user_id);
    return (
      profile?.full_name.toLowerCase() ===
      screening.patient_name.trim().toLowerCase()
    );
  });
  if (byName?.id) return byName.id;
  // Never silently attach camp strangers to the demo patient.
  if (screening.patient_name.trim()) {
    return ruralRepository.registerOfflinePatient({
      full_name: screening.patient_name.trim(),
      village: screening.village || undefined,
    });
  }
  return IDS.patient;
}

function applyScreeningToStore(screening: RuralScreeningRecord) {
  const patientId = resolvePatientId(screening);
  const stamp = screening.updated_at || screening.captured_at;

  updateStore((draft) => {
    // Conflict: skip if a newer check-in already exists with same rural id marker
    const existing = draft.checkins.find(
      (c) =>
        c.notes?.includes(`[rural:${screening.id}]`) ||
        (c.id === screening.id),
    );
    if (existing) {
      const existingTs = existing.recorded_at;
      if (existingTs >= stamp) return; // keep server/store version
    }

    if (!existing) {
      draft.checkins.push({
        id: screening.id,
        patient_id: patientId,
        recorded_at: screening.captured_at,
        bp_systolic: screening.bp_systolic,
        bp_diastolic: screening.bp_diastolic,
        blood_sugar: screening.blood_sugar,
        temperature: screening.temperature,
        weight: screening.weight,
        oxygen: screening.oxygen,
        symptoms: screening.symptoms,
        pain_score: screening.pain_score,
        mood: null,
        sleep_hours: null,
        water_intake: null,
        exercise: null,
        medicine_taken: screening.medicine_taken,
        notes: `${screening.notes || ""} [rural:${screening.id}]`.trim(),
      });
    } else {
      Object.assign(existing, {
        recorded_at: screening.captured_at,
        bp_systolic: screening.bp_systolic,
        bp_diastolic: screening.bp_diastolic,
        blood_sugar: screening.blood_sugar,
        temperature: screening.temperature,
        weight: screening.weight,
        oxygen: screening.oxygen,
        symptoms: screening.symptoms,
        pain_score: screening.pain_score,
        medicine_taken: screening.medicine_taken,
        notes: `${screening.notes || ""} [rural:${screening.id}]`.trim(),
      });
    }

    if (screening.emergency) {
      const severity: RiskLevel = "critical";
      const already = draft.alerts.some(
        (a) => a.body.includes(screening.id) || a.id === `alert-${screening.id}`,
      );
      if (!already) {
        draft.alerts.unshift({
          id: `alert-${screening.id}`,
          patient_id: patientId,
          alert_type: "rural_emergency",
          severity,
          title: "Rural emergency screening",
          body: `${screening.patient_name}: ${screening.emergency_reasons.join("; ")} (${screening.id})`,
          reason: screening.emergency_reasons.join("; "),
          status: "open",
          assigned_doctor_id: IDS.doctor,
          checkin_id: null,
          resolved_at: null,
          created_at: new Date().toISOString(),
        });
      }

      // Highlight on doctor high-risk list
      const risk = draft.risks.find((r) => r.patient_id === patientId);
      if (risk) {
        risk.level = "critical";
        risk.score = Math.max(risk.score, 85);
        risk.computed_at = new Date().toISOString();
      } else {
        draft.risks.push({
          patient_id: patientId,
          score: 85,
          level: "critical",
          computed_at: new Date().toISOString(),
        });
      }

      // Notify patient user + caregiver-style notification
      const patient = draft.patients.find((p) => p.id === patientId);
      if (patient) {
        draft.notifications.unshift({
          id: newId(),
          user_id: patient.user_id,
          type: "emergency",
          title: "Emergency alert from field visit",
          body: screening.emergency_reasons.join("; "),
          read: false,
          created_at: new Date().toISOString(),
        });
      }
      draft.notifications.unshift({
        id: newId(),
        user_id: IDS.doctorUser,
        type: "emergency",
        title: "Rural emergency — doctor review",
        body: `${screening.patient_name}: ${screening.emergency_reasons.join("; ")}`,
        read: false,
        created_at: new Date().toISOString(),
      });
    }
  });
}

async function pushSupabaseScreening(screening: RuralScreeningRecord) {
  if (!env.isSupabaseConfigured) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const patientId = resolvePatientId(screening);
  await supabase.from("checkins").upsert({
    id: screening.id,
    patient_id: patientId,
    recorded_at: screening.captured_at,
    bp_systolic: screening.bp_systolic,
    bp_diastolic: screening.bp_diastolic,
    blood_sugar: screening.blood_sugar,
    temperature: screening.temperature,
    weight: screening.weight,
    oxygen: screening.oxygen,
    symptoms: screening.symptoms,
    pain_score: screening.pain_score,
    medicine_taken: screening.medicine_taken,
    notes: screening.notes,
  });
}

export async function runRuralSync(): Promise<SyncSummary> {
  if (!isOnline()) {
    return {
      synced: 0,
      failed: 0,
      pending: await countPendingSync(),
      conflicts_resolved: 0,
    };
  }

  let synced = 0;
  let failed = 0;
  let conflicts_resolved = 0;

  const screenings = await listScreenings();
  for (const row of screenings) {
    if (row.sync_state === "synced") continue;
    await updateScreening({ ...row, sync_state: "syncing", error: null });
    try {
      const before = getStore().checkins.find((c) =>
        c.notes?.includes(`[rural:${row.id}]`),
      );
      applyScreeningToStore(row);
      const after = getStore().checkins.find((c) =>
        c.notes?.includes(`[rural:${row.id}]`),
      );
      if (before && after && before.recorded_at !== after.recorded_at) {
        conflicts_resolved += 1;
      }
      await pushSupabaseScreening(row);
      await updateScreening({
        ...row,
        sync_state: "synced",
        error: null,
      });
      synced += 1;
    } catch (err) {
      await updateScreening({
        ...row,
        sync_state: "failed",
        error: err instanceof Error ? err.message : "Sync failed",
      });
      failed += 1;
    }
  }

  const notifications = await listNotifications();
  for (const n of notifications) {
    if (n.sync_state === "synced") continue;
    try {
      await markNotification({ ...n, sync_state: "syncing" });
      // Deliver into central notification inbox for HW user
      updateStore((draft) => {
        const exists = draft.notifications.some(
          (x) => x.id === n.id || x.body.includes(n.id),
        );
        if (!exists) {
          draft.notifications.unshift({
            id: n.id,
            user_id: IDS.healthWorkerUser,
            type: n.kind === "emergency" ? "emergency" : "doctor_message",
            title: n.title,
            body: n.body,
            read: false,
            created_at: n.created_at,
          });
        }
      });
      await markNotification({
        ...n,
        sync_state: "synced",
        delivered_at: new Date().toISOString(),
      });
      synced += 1;
    } catch (err) {
      await markNotification({
        ...n,
        sync_state: "failed",
      });
      failed += 1;
      void err;
    }
  }

  return {
    synced,
    failed,
    pending: await countPendingSync(),
    conflicts_resolved,
  };
}

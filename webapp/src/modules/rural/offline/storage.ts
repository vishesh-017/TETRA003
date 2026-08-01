import { newId } from "@/data/store";
import { idbGetAll, idbPut, STORES } from "@/modules/rural/offline/db";
import type {
  RuralNotification,
  RuralScreeningInput,
  RuralScreeningRecord,
} from "@/modules/rural/types";
import { evaluateEmergency } from "@/modules/rural/services/emergency.service";

export async function listScreenings(): Promise<RuralScreeningRecord[]> {
  const rows = await idbGetAll<RuralScreeningRecord>(STORES.screenings);
  return rows.sort((a, b) => b.captured_at.localeCompare(a.captured_at));
}

export async function saveScreening(
  healthWorkerId: string,
  input: RuralScreeningInput,
): Promise<RuralScreeningRecord> {
  const emergency = evaluateEmergency(input);
  const record: RuralScreeningRecord = {
    ...input,
    id: newId(),
    health_worker_id: healthWorkerId,
    captured_at: new Date().toISOString(),
    sync_state: "pending",
    emergency: emergency.isEmergency,
    emergency_reasons: emergency.reasons,
    client_version: 1,
    error: null,
  };
  await idbPut(STORES.screenings, record);
  if (emergency.isEmergency) {
    await enqueueNotification({
      title: "Emergency Alert",
      body: `${input.patient_name}: ${emergency.reasons.join("; ")}`,
      kind: "emergency",
      patient_id: input.patient_id,
    });
  }
  return record;
}

export async function updateScreening(
  record: RuralScreeningRecord,
): Promise<RuralScreeningRecord> {
  const next = {
    ...record,
    client_version: (record.client_version || 1) + 1,
    updated_at: new Date().toISOString(),
  } as RuralScreeningRecord;
  await idbPut(STORES.screenings, next);
  return next;
}

export async function listNotifications(): Promise<RuralNotification[]> {
  const rows = await idbGetAll<RuralNotification>(STORES.notifications);
  return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function enqueueNotification(input: {
  title: string;
  body: string;
  kind: RuralNotification["kind"];
  patient_id?: string | null;
}): Promise<RuralNotification> {
  const row: RuralNotification = {
    id: newId(),
    title: input.title,
    body: input.body,
    kind: input.kind,
    created_at: new Date().toISOString(),
    sync_state: "pending",
    delivered_at: null,
    patient_id: input.patient_id ?? null,
  };
  await idbPut(STORES.notifications, row);
  return row;
}

export async function markNotification(
  row: RuralNotification,
): Promise<RuralNotification> {
  await idbPut(STORES.notifications, row);
  return row;
}

export async function countPendingSync(): Promise<number> {
  const [screenings, notifications] = await Promise.all([
    listScreenings(),
    listNotifications(),
  ]);
  return (
    screenings.filter((s) => s.sync_state === "pending" || s.sync_state === "failed")
      .length +
    notifications.filter(
      (n) => n.sync_state === "pending" || n.sync_state === "failed",
    ).length
  );
}

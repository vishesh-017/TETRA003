/**
 * Legacy offline helpers — rural field app uses `@/modules/rural/offline/*`.
 * Kept for compatibility with older query keys.
 */

import {
  listScreenings,
} from "@/modules/rural/offline/storage";
import { runRuralSync } from "@/modules/rural/offline/sync-engine";
import type { OfflineRecord } from "@/types/domain";

export async function listOfflineRecords(): Promise<OfflineRecord[]> {
  const rows = await listScreenings();
  return rows.map((r) => ({
    id: r.id,
    entity_type: "rural_screening",
    payload: r as unknown as Record<string, unknown>,
    sync_state: r.sync_state,
    captured_at: r.captured_at,
    role: "health_worker",
    error: r.error,
  }));
}

export async function saveOfflineRecord(record: OfflineRecord) {
  return record;
}

export async function simulateOfflineSync() {
  const result = await runRuralSync();
  return { synced: result.synced, pending: result.pending };
}

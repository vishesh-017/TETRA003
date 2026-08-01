/**
 * Simplified offline mode: IndexedDB when available, localStorage fallback.
 * Simulated sync only — no conflict-resolution engine.
 */

import type { OfflineRecord } from "@/types/domain";

const STORAGE_KEY = "healnexus.offline.records";
const DB_NAME = "healnexus-offline";
const STORE_NAME = "records";

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function readFromLocalStorage(): OfflineRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as OfflineRecord[];
  } catch {
    return [];
  }
}

function writeToLocalStorage(records: OfflineRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listOfflineRecords(): Promise<OfflineRecord[]> {
  if (!canUseIndexedDb()) {
    return readFromLocalStorage();
  }

  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result as OfflineRecord[]) ?? []);
    request.onerror = () => reject(request.error);
  });
}

export async function saveOfflineRecord(
  record: OfflineRecord,
): Promise<OfflineRecord> {
  if (!canUseIndexedDb()) {
    const all = readFromLocalStorage();
    const next = [...all.filter((item) => item.id !== record.id), record];
    writeToLocalStorage(next);
    return record;
  }

  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => resolve(record);
    tx.onerror = () => reject(tx.error);
  });
}

/** Simulated sync: flip pending → synced locally. */
export async function simulateOfflineSync(): Promise<{
  synced: number;
  pending: number;
}> {
  const records = await listOfflineRecords();
  let synced = 0;
  for (const record of records) {
    if (record.sync_state === "pending") {
      await saveOfflineRecord({ ...record, sync_state: "synced" });
      synced += 1;
    }
  }
  const remaining = (await listOfflineRecords()).filter(
    (item) => item.sync_state === "pending",
  ).length;
  return { synced, pending: remaining };
}

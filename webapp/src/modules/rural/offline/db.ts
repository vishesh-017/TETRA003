/**
 * Rural offline IndexedDB — separate from sync logic.
 * Falls back to localStorage if IndexedDB is unavailable.
 */

const DB_NAME = "healnexus-rural-v1";
const DB_VERSION = 1;
export const STORES = {
  screenings: "screenings",
  notifications: "notifications",
  meta: "meta",
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

function canUseIdb() {
  return typeof indexedDB !== "undefined";
}

function lsKey(store: StoreName) {
  return `healnexus.rural.${store}`;
}

function lsRead<T>(store: StoreName): T[] {
  try {
    return JSON.parse(localStorage.getItem(lsKey(store)) || "[]") as T[];
  } catch {
    return [];
  }
}

function lsWrite<T extends { id: string }>(store: StoreName, rows: T[]) {
  localStorage.setItem(lsKey(store), JSON.stringify(rows));
}

export function openRuralDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of Object.values(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          const os = db.createObjectStore(name, { keyPath: "id" });
          if (name === STORES.screenings) {
            os.createIndex("sync_state", "sync_state", { unique: false });
            os.createIndex("captured_at", "captured_at", { unique: false });
          }
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGetAll<T>(store: StoreName): Promise<T[]> {
  if (!canUseIdb()) return lsRead<T>(store);
  const db = await openRuralDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
  });
}

export async function idbPut<T extends { id: string }>(
  store: StoreName,
  row: T,
): Promise<T> {
  if (!canUseIdb()) {
    const all = lsRead<T>(store).filter((r) => r.id !== row.id);
    all.push(row);
    lsWrite(store, all);
    return row;
  }
  const db = await openRuralDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(row);
    tx.oncomplete = () => resolve(row);
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbDelete(store: StoreName, id: string): Promise<void> {
  if (!canUseIdb()) {
    lsWrite(
      store,
      lsRead<{ id: string }>(store).filter((r) => r.id !== id),
    );
    return;
  }
  const db = await openRuralDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function idbGetMeta<T>(key: string): Promise<T | null> {
  const rows = await idbGetAll<{ id: string; value: T }>(STORES.meta);
  return rows.find((r) => r.id === key)?.value ?? null;
}

export async function idbSetMeta<T>(key: string, value: T): Promise<void> {
  await idbPut(STORES.meta, { id: key, value });
}

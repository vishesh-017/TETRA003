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
  try {
    localStorage.setItem(lsKey(store), JSON.stringify(rows));
  } catch {
    // Quota / private mode — IndexedDB may still hold the row.
  }
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
  const fromLs = lsRead<T>(store);
  if (!canUseIdb()) return fromLs;
  try {
    const db = await openRuralDb();
    const fromIdb = await new Promise<T[]>((resolve, reject) => {
      const tx = db.transaction(store, "readonly");
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve((req.result as T[]) ?? []);
      req.onerror = () => reject(req.error);
    });
    // Merge localStorage fallback rows (private-mode saves) with IDB.
    if (!fromLs.length) return fromIdb;
    const map = new Map<string, T>();
    for (const row of fromIdb) {
      const id = (row as { id?: string }).id;
      if (id) map.set(id, row);
    }
    for (const row of fromLs) {
      const id = (row as { id?: string }).id;
      if (id) map.set(id, row);
    }
    return [...map.values()];
  } catch {
    return fromLs;
  }
}

export async function idbPut<T extends { id: string }>(
  store: StoreName,
  row: T,
): Promise<T> {
  const toLocal = () => {
    const all = lsRead<T>(store).filter((r) => r.id !== row.id);
    all.push(row);
    lsWrite(store, all);
    return row;
  };
  // Always mirror to localStorage so saves survive if IndexedDB is cleared
  // or blocked (no cookies / downloads required).
  toLocal();
  if (!canUseIdb()) return row;
  try {
    const db = await openRuralDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, "readwrite");
      tx.objectStore(store).put(row);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    return row;
  } catch {
    // Private mode / quota / IDB blocked — localStorage already has the row.
    return row;
  }
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

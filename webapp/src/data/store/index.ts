import { createSeedStore } from "./seed";
import {
  STORAGE_KEY,
  STORE_VERSION,
  type HealNexusStore,
} from "./types";

function clone<T>(value: T): T {
  return structuredClone(value);
}

function load(): HealNexusStore {
  if (typeof window === "undefined") return createSeedStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = createSeedStore();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as HealNexusStore;
    if (!parsed?.version || parsed.version !== STORE_VERSION) {
      const seeded = createSeedStore();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    return parsed;
  } catch {
    const seeded = createSeedStore();
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
    return seeded;
  }
}

let memory: HealNexusStore | null = null;
const listeners = new Set<() => void>();

export function getStore(): HealNexusStore {
  if (!memory) memory = load();
  return memory;
}

export function saveStore(next: HealNexusStore): HealNexusStore {
  memory = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((fn) => fn());
  return memory;
}

export function updateStore(
  mutator: (draft: HealNexusStore) => void,
): HealNexusStore {
  const draft = clone(getStore());
  mutator(draft);
  return saveStore(draft);
}

export function resetStore(): HealNexusStore {
  return saveStore(createSeedStore());
}

export function subscribeStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
}

export * from "./types";

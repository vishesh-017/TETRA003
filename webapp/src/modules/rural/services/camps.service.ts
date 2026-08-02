import { newId } from "@/data/store";
import type { RuralScreeningRecord } from "@/modules/rural/types";

/** Bumped so old Sinnar/Deesa seeds are replaced by Ahmedabad camps. */
const CAMPS_KEY = "healnexus.rural.camps.v2";

export type CampLocation = {
  id: string;
  name: string;
  place: string;
  villageKey: string;
  lat: number;
  lng: number;
  date: string;
  screened: number;
  status: "pending" | "synced";
  portalUsernames: string[];
  /** Only admin-created (or seeded) camps appear in the HW dropdown. */
  created_by_admin: boolean;
};

/** Ahmedabad area sites for camps + patient pins. */
export const AHMEDABAD_AREAS: Record<
  string,
  { place: string; villageKey: string; lat: number; lng: number }
> = {
  Navrangpura: {
    place: "Urban Health Centre, Navrangpura",
    villageKey: "Navrangpura",
    lat: 23.035,
    lng: 72.5635,
  },
  Sarkhej: {
    place: "Community Hall, Sarkhej",
    villageKey: "Sarkhej",
    lat: 22.982,
    lng: 72.501,
  },
  Maninagar: {
    place: "PHC Camp Ground, Maninagar",
    villageKey: "Maninagar",
    lat: 22.997,
    lng: 72.603,
  },
  Satellite: {
    place: "Satellite Community Centre",
    villageKey: "Satellite",
    lat: 23.025,
    lng: 72.508,
  },
  Bapunagar: {
    place: "Municipal Hall, Bapunagar",
    villageKey: "Bapunagar",
    lat: 23.041,
    lng: 72.631,
  },
  Chandkheda: {
    place: "PHC, Chandkheda",
    villageKey: "Chandkheda",
    lat: 23.108,
    lng: 72.581,
  },
  Vastrapur: {
    place: "Lake Garden Camp Site, Vastrapur",
    villageKey: "Vastrapur",
    lat: 23.036,
    lng: 72.529,
  },
  Paldi: {
    place: "Civil Hospital outreach, Paldi",
    villageKey: "Paldi",
    lat: 23.014,
    lng: 72.566,
  },
  Gota: {
    place: "Community Hall, Gota",
    villageKey: "Gota",
    lat: 23.101,
    lng: 72.541,
  },
  Thaltej: {
    place: "Thaltej Urban Health Post",
    villageKey: "Thaltej",
    lat: 23.052,
    lng: 72.498,
  },
  Ahmedabad: {
    place: "Central Ahmedabad Camp Hub",
    villageKey: "Ahmedabad",
    lat: 23.0225,
    lng: 72.5714,
  },
};

export function areaKeys(): string[] {
  return Object.keys(AHMEDABAD_AREAS).filter((k) => k !== "Ahmedabad");
}

function readCamps(): CampLocation[] {
  try {
    return JSON.parse(localStorage.getItem(CAMPS_KEY) || "[]") as CampLocation[];
  } catch {
    return [];
  }
}

function writeCamps(rows: CampLocation[]) {
  try {
    localStorage.setItem(CAMPS_KEY, JSON.stringify(rows));
  } catch {
    // private mode
  }
}

function seedAhmedabadCamps(): CampLocation[] {
  const today = new Date();
  const mk = (
    id: string,
    area: keyof typeof AHMEDABAD_AREAS,
    title: string,
    screened: number,
    status: CampLocation["status"],
    dayOffset: number,
  ): CampLocation => {
    const site = AHMEDABAD_AREAS[area];
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    return {
      id,
      name: title,
      place: site.place,
      villageKey: site.villageKey,
      lat: site.lat,
      lng: site.lng,
      date: d.toISOString(),
      screened,
      status,
      portalUsernames: status === "synced" ? ["asha.patel"] : [],
      created_by_admin: true,
    };
  };

  return [
    mk(
      "camp-navrangpura",
      "Navrangpura",
      "NCD Camp — Navrangpura PHC",
      4,
      "synced",
      0,
    ),
    mk(
      "camp-sarkhej",
      "Sarkhej",
      "NCD Outreach — Sarkhej Block",
      2,
      "pending",
      1,
    ),
    mk(
      "camp-maninagar",
      "Maninagar",
      "Diabetes Screening — Maninagar",
      6,
      "synced",
      -1,
    ),
    mk(
      "camp-satellite",
      "Satellite",
      "BP & Sugar Camp — Satellite",
      3,
      "pending",
      2,
    ),
    mk(
      "camp-vastrapur",
      "Vastrapur",
      "Family NCD Camp — Vastrapur",
      5,
      "synced",
      0,
    ),
  ];
}

function ensureSeeded(): CampLocation[] {
  let camps = readCamps();
  if (!camps.length) {
    camps = seedAhmedabadCamps();
    writeCamps(camps);
  }
  return camps.map((c) => ({
    ...c,
    created_by_admin: c.created_by_admin ?? true,
  }));
}

function mergeScreeningCounts(
  camps: CampLocation[],
  screenings: RuralScreeningRecord[],
): CampLocation[] {
  const counts = new Map<
    string,
    { screened: number; date: string; pending: boolean }
  >();
  for (const s of screenings) {
    const match = s.notes?.match(/Camp:\s*(.+)$/i);
    if (!match?.[1]) continue;
    const name = match[1].trim();
    const key = name.toLowerCase();
    const prev = counts.get(key);
    counts.set(key, {
      screened: (prev?.screened || 0) + 1,
      date: s.captured_at,
      pending:
        (prev?.pending ?? false) ||
        s.sync_state === "pending" ||
        s.sync_state === "failed",
    });
  }
  return camps.map((c) => {
    const meta = counts.get(c.name.toLowerCase());
    if (!meta) return c;
    return {
      ...c,
      screened: Math.max(c.screened, meta.screened),
      date: meta.date > c.date ? meta.date : c.date,
      status: meta.pending ? "pending" : c.status,
    };
  });
}

/** Camps available in health-worker dropdown (admin-created / seeded). */
export function listSelectableCamps(): CampLocation[] {
  return ensureSeeded()
    .filter((c) => c.created_by_admin)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listCampLocations(
  screenings?: RuralScreeningRecord[],
): CampLocation[] {
  const base = ensureSeeded();
  const camps = screenings?.length
    ? mergeScreeningCounts(base, screenings)
    : base;
  return camps.sort((a, b) => b.date.localeCompare(a.date));
}

/** Admin-only: create a new Ahmedabad camp for the HW dropdown. */
export function createCampByAdmin(input: {
  name: string;
  areaKey: string;
}): CampLocation {
  const name = input.name.trim();
  if (!name) throw new Error("Camp name is required");
  const site =
    AHMEDABAD_AREAS[input.areaKey] || AHMEDABAD_AREAS.Ahmedabad;
  const camps = ensureSeeded();
  if (camps.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
    throw new Error("A camp with this name already exists");
  }
  const row: CampLocation = {
    id: newId(),
    name,
    place: site.place,
    villageKey: site.villageKey,
    lat: site.lat,
    lng: site.lng,
    date: new Date().toISOString(),
    screened: 0,
    status: "pending",
    portalUsernames: [],
    created_by_admin: true,
  };
  camps.unshift(row);
  writeCamps(camps);
  return row;
}

export function upsertCampBatch(input: {
  name: string;
  screened: number;
  portalUsernames?: string[];
}): CampLocation | null {
  const camps = ensureSeeded();
  const key = input.name.trim().toLowerCase();
  const usernames = (input.portalUsernames || [])
    .map((u) => u.trim())
    .filter(Boolean);
  const existing = camps.find((c) => c.name.toLowerCase() === key);
  if (!existing) {
    // Workers cannot invent camps — must pick admin camp from dropdown.
    return null;
  }
  existing.screened += input.screened;
  existing.date = new Date().toISOString();
  existing.status = "pending";
  for (const u of usernames) {
    if (!existing.portalUsernames.includes(u)) {
      existing.portalUsernames.push(u);
    }
  }
  writeCamps(camps);
  return existing;
}

export function resolvePatientCoords(
  village: string | null | undefined,
  indexInArea: number,
  totalInArea: number,
): [number, number] {
  const raw = (village || "Ahmedabad").split(/[—–-]/)[0]?.trim() || "Ahmedabad";
  let site = AHMEDABAD_AREAS.Ahmedabad;
  for (const [key, s] of Object.entries(AHMEDABAD_AREAS)) {
    if (
      raw.toLowerCase().includes(key.toLowerCase()) ||
      key.toLowerCase().includes(raw.toLowerCase())
    ) {
      site = s;
      break;
    }
  }
  if (totalInArea <= 1) return [site.lat, site.lng];
  const angle = (indexInArea / totalInArea) * Math.PI * 2;
  const radius = 0.0035 + indexInArea * 0.0006;
  return [
    site.lat + Math.sin(angle) * radius,
    site.lng + Math.cos(angle) * radius,
  ];
}

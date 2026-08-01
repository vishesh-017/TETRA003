import { Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

import { SafeMapContainer } from "@/components/maps/safe-map";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  AHMEDABAD_DEMO_HOSPITALS,
  hospitalPinColor,
} from "@/data/ahmedabad-hospitals";
import { useAppLocale } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";
import type { DemoHospital } from "@/types/domain";

function makePinIcon(color: string) {
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
      <defs>
        <filter id="s" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path filter="url(#s)" fill="${color}" d="M18 1C9.7 1 3 7.7 3 16c0 11.2 15 30 15 30s15-18.8 15-30C33 7.7 26.3 1 18 1z"/>
      <circle cx="18" cy="16" r="6.5" fill="white"/>
      <circle cx="18" cy="16" r="3.2" fill="${color}"/>
    </svg>
  `);
  return L.icon({
    iconUrl: `data:image/svg+xml,${svg}`,
    iconSize: [36, 48],
    iconAnchor: [18, 46],
    popupAnchor: [0, -40],
  });
}

type Filter = "all" | "pmjay" | "emergency" | "government";

export function HospitalMapPage() {
  const { user } = useAuth();
  const { t } = useAppLocale();
  const [filter, setFilter] = useState<Filter>("all");
  const center: [number, number] = [23.0225, 72.5714];

  const hospitals = useMemo(() => {
    return AHMEDABAD_DEMO_HOSPITALS.filter((h) => {
      if (filter === "pmjay") return h.pmjay_empanelled;
      if (filter === "emergency") return h.is_emergency;
      if (filter === "government") return h.hospital_type === "government";
      return true;
    });
  }, [filter]);

  const icons = useMemo(() => {
    const map = new Map<string, L.Icon>();
    for (const h of AHMEDABAD_DEMO_HOSPITALS) {
      map.set(h.id, makePinIcon(hospitalPinColor(h)));
    }
    return map;
  }, []);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            {t("hospitals_title")}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            {t("hospitals_subtitle")}
          </p>
        </div>
        {user?.role === "patient" ? (
          <Link
            to="/government/pmjay"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            {t("pmjay_assistant")}
          </Link>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["pmjay", "PM-JAY"],
            ["emergency", t("emergency")],
            ["government", "Government"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              filter === id
                ? "bg-[#2563EB] text-white shadow-sm"
                : "border border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-[11px] font-medium text-muted-foreground">
        <Legend color="#2563EB" label="Government" />
        <Legend color="#14B8A6" label="PM-JAY private / network" />
        <Legend color="#EF4444" label={t("emergency")} />
      </div>

      <div className="map-shell h-[440px] overflow-hidden rounded-3xl border border-border shadow-soft">
        <SafeMapContainer
          center={center}
          zoom={12}
          scrollWheelZoom={false}
          className="h-full w-full rounded-3xl"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {hospitals.map((h) => (
            <Marker
              key={h.id}
              position={[h.latitude, h.longitude]}
              icon={icons.get(h.id)!}
            >
              <Popup>
                <strong>{h.name}</strong>
                <br />
                {h.address}
                <br />
                {h.pmjay_empanelled
                  ? `${t("pmjay_available")}`
                  : t("pmjay_not_available")}
                {h.is_emergency ? ` · ${t("emergency")}` : ""}
                {h.pmjay_departments?.length ? (
                  <>
                    <br />
                    <span style={{ fontSize: 11 }}>
                      {t("departments")}: {h.pmjay_departments.join(", ")}
                    </span>
                  </>
                ) : null}
                <br />
                <a href={`tel:${h.phone}`}>{h.phone}</a>
              </Popup>
            </Marker>
          ))}
        </SafeMapContainer>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {hospitals.map((h) => (
          <HospitalCard key={h.id} hospital={h} />
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function HospitalCard({ hospital: h }: { hospital: DemoHospital }) {
  const { t } = useAppLocale();
  const color = hospitalPinColor(h);

  return (
    <article className="flex flex-col rounded-3xl border border-border/80 bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold leading-snug text-foreground">{h.name}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {h.area || h.address}
          </p>
        </div>
        <span
          className="mt-0.5 h-3 w-3 shrink-0 rounded-full ring-2 ring-white"
          style={{ background: color }}
          aria-hidden
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {h.pmjay_empanelled ? (
          <span className="rounded-full bg-[#14B8A6]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0F766E]">
            {t("pmjay_available")}
          </span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            {t("pmjay_not_available")}
          </span>
        )}
        {h.is_emergency ? (
          <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
            {t("emergency")}
          </span>
        ) : null}
      </div>

      {h.pmjay_empanelled && h.pmjay_departments?.length ? (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("departments")}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {h.pmjay_departments.map((d) => (
              <span
                key={d}
                className="rounded-lg bg-[#2563EB]/8 px-2 py-1 text-[11px] font-medium text-[#1E40AF]"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-auto flex gap-2 pt-4">
        <a
          href={`tel:${h.phone}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}
        >
          {t("call")}
        </a>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${h.latitude},${h.longitude}`}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ size: "sm" }), "flex-1")}
        >
          {t("open_maps")}
        </a>
      </div>
    </article>
  );
}

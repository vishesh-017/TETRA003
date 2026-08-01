import { useEffect, useMemo, useState } from "react";
import { Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import { SafeMapContainer } from "@/components/maps/safe-map";
import { AHMEDABAD_MAP_CENTER } from "@/data/ahmedabad-hospitals";
import { Badge } from "@/components/ui/badge";
import type { HospitalMapItem } from "@/modules/analytics/types";
import { cn } from "@/lib/utils";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type MapFilter = "all" | "government" | "pmjay" | "emergency";

function FlyTo({ hospital }: { hospital: HospitalMapItem | null }) {
  const map = useMap();
  useEffect(() => {
    if (!hospital) return;
    map.flyTo([hospital.latitude, hospital.longitude], 14, { duration: 0.6 });
  }, [hospital, map]);
  return null;
}

export function HospitalMapPanel({ hospitals }: { hospitals: HospitalMapItem[] }) {
  const [filter, setFilter] = useState<MapFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (filter === "all") return hospitals;
    if (filter === "pmjay")
      return hospitals.filter((h) => h.pmjay_empanelled || h.hospital_type === "pmjay");
    if (filter === "government")
      return hospitals.filter((h) => h.hospital_type === "government");
    return hospitals.filter((h) => h.is_emergency || h.hospital_type === "emergency");
  }, [hospitals, filter]);

  const selected =
    visible.find((h) => h.id === selectedId) || visible[0] || null;

  return (
    <section className="rounded-3xl border border-border/80 bg-card/70 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">
            Ahmedabad Hospital Map
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Government, PM-JAY, and emergency centres near the care network.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 rounded-2xl border border-border bg-muted/40 p-1">
          {(
            [
              ["all", "All"],
              ["government", "Government"],
              ["pmjay", "PM-JAY"],
              ["emergency", "Emergency"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-medium",
                filter === id
                  ? "bg-card text-foreground shadow-soft"
                  : "text-muted-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="map-shell h-[380px] rounded-3xl border border-border">
          <SafeMapContainer
            center={[AHMEDABAD_MAP_CENTER.lat, AHMEDABAD_MAP_CENTER.lng]}
            zoom={12}
            scrollWheelZoom={false}
            className="h-full w-full rounded-3xl"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyTo hospital={selected} />
            {visible.map((h) => (
              <Marker
                key={h.id}
                position={[h.latitude, h.longitude]}
                icon={icon}
                eventHandlers={{ click: () => setSelectedId(h.id) }}
              >
                <Popup>
                  <strong>{h.name}</strong>
                  <br />
                  {h.address}
                </Popup>
              </Marker>
            ))}
          </SafeMapContainer>
        </div>

        <div className="space-y-3">
          {selected ? (
            <div className="rounded-3xl border border-primary/25 bg-primary/5 p-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">
                  {selected.hospital_type}
                </Badge>
                {selected.pmjay_empanelled ? (
                  <Badge variant="secondary">PM-JAY</Badge>
                ) : null}
                {selected.is_emergency ? (
                  <Badge variant="destructive">Emergency</Badge>
                ) : null}
              </div>
              <h3 className="mt-2 font-display text-lg font-semibold">
                {selected.name}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {selected.address}
              </p>
              <dl className="mt-3 grid gap-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Distance</dt>
                  <dd className="font-medium">{selected.distance_km} km</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Contact</dt>
                  <dd>
                    <a
                      className="font-medium text-primary underline-offset-2 hover:underline"
                      href={`tel:${selected.phone}`}
                    >
                      {selected.phone}
                    </a>
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Available services
              </p>
              <ul className="mt-1 space-y-1 text-sm">
                {selected.services.map((s) => (
                  <li key={s}>· {s}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="max-h-48 space-y-2 overflow-y-auto">
            {visible.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setSelectedId(h.id)}
                className={cn(
                  "w-full rounded-2xl border px-3 py-2 text-left text-sm transition-colors",
                  selected?.id === h.id
                    ? "border-primary/40 bg-primary/10"
                    : "border-border/70 hover:bg-muted/40",
                )}
              >
                <p className="font-medium">{h.name}</p>
                <p className="text-xs text-muted-foreground">
                  {h.distance_km} km · {h.hospital_type}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

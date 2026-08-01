import { useEffect, useMemo } from "react";
import { CircleMarker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import { SafeMapContainer } from "@/components/maps/safe-map";
import type { AssignedPatient } from "@/modules/rural/types";

/** Real OpenStreetMap coordinates for assigned field villages (Gujarat). */
const VILLAGE_COORDS: Record<string, { lat: number; lng: number }> = {
  Sanand: { lat: 22.9924, lng: 72.3817 },
  Bavla: { lat: 22.8275, lng: 72.3624 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Navrangpura: { lat: 23.035, lng: 72.5635 },
  Sarkhej: { lat: 22.982, lng: 72.501 },
};

function resolveVillageKey(village: string | null | undefined): string {
  const raw = (village || "Ahmedabad").split("/")[0]?.trim() || "Ahmedabad";
  const hit = Object.keys(VILLAGE_COORDS).find(
    (k) => k.toLowerCase() === raw.toLowerCase(),
  );
  return hit || "Ahmedabad";
}

function riskColor(level: string | null | undefined) {
  if (level === "critical") return "#DC2626";
  if (level === "high") return "#EA580C";
  if (level === "moderate") return "#D97706";
  return "#2563EB";
}

function FitBounds({
  points,
}: {
  points: Array<[number, number]>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 12);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 });
  }, [map, points]);
  return null;
}

/** Spread patients in the same village so markers/labels do not overlap. */
function jitteredPosition(
  base: { lat: number; lng: number },
  indexInVillage: number,
  totalInVillage: number,
): [number, number] {
  if (totalInVillage <= 1) return [base.lat, base.lng];
  const angle = (indexInVillage / totalInVillage) * Math.PI * 2;
  const radius = 0.004 + indexInVillage * 0.0008; // ~400m+
  return [
    base.lat + Math.sin(angle) * radius,
    base.lng + Math.cos(angle) * radius,
  ];
}

export function FieldPatientsMap({ patients }: { patients: AssignedPatient[] }) {
  const markers = useMemo(() => {
    const byVillage = new Map<string, AssignedPatient[]>();
    for (const p of patients) {
      const key = resolveVillageKey(p.village);
      const arr = byVillage.get(key) || [];
      arr.push(p);
      byVillage.set(key, arr);
    }

    const out: Array<{
      patient: AssignedPatient;
      position: [number, number];
      villageKey: string;
    }> = [];

    for (const [villageKey, group] of byVillage) {
      const base = VILLAGE_COORDS[villageKey] || VILLAGE_COORDS.Ahmedabad;
      group.forEach((patient, i) => {
        out.push({
          patient,
          villageKey,
          position: jitteredPosition(base, i, group.length),
        });
      });
    }
    return out;
  }, [patients]);

  const points = markers.map((m) => m.position);
  const center: [number, number] = points[0] || [22.98, 72.45];

  return (
    <div className="map-shell h-[320px] overflow-hidden rounded-3xl border border-border shadow-soft sm:h-[380px]">
      <SafeMapContainer
        center={center}
        zoom={11}
        scrollWheelZoom
        className="h-full w-full rounded-3xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {markers.map(({ patient, position, villageKey }) => (
          <CircleMarker
            key={patient.id}
            center={position}
            radius={10}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: riskColor(patient.risk_level),
              fillOpacity: 0.95,
            }}
          >
            <Popup>
              <div style={{ minWidth: 140 }}>
                <strong>{patient.full_name}</strong>
                <br />
                <span style={{ fontSize: 12 }}>
                  {patient.village || villageKey}
                  {patient.phone ? ` · ${patient.phone}` : ""}
                </span>
                <br />
                <span style={{ fontSize: 12, textTransform: "capitalize" }}>
                  Risk: {patient.risk_level || "—"}
                </span>
                {patient.conditions?.length ? (
                  <>
                    <br />
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      {patient.conditions.slice(0, 3).join(", ")}
                    </span>
                  </>
                ) : null}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </SafeMapContainer>
    </div>
  );
}

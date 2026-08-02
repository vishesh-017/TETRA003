import { useEffect, useMemo } from "react";
import {
  CircleMarker,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";

import { SafeMapContainer } from "@/components/maps/safe-map";
import type { CampLocation } from "@/modules/rural/services/camps.service";
import { resolvePatientCoords } from "@/modules/rural/services/camps.service";
import type { AssignedPatient } from "@/modules/rural/types";

const campIcon = L.divIcon({
  className: "healnexus-camp-pin",
  html: `<div style="
    width:34px;height:34px;border-radius:9999px;
    background:#0F766E;color:#fff;font-weight:700;font-size:14px;
    display:flex;align-items:center;justify-content:center;
    border:2px solid #fff;box-shadow:0 2px 10px rgba(15,23,42,.28);
  ">C</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -16],
});

function riskColor(level: string | null | undefined) {
  if (level === "critical") return "#DC2626";
  if (level === "high") return "#EA580C";
  if (level === "moderate") return "#D97706";
  return "#2563EB";
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
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

export function FieldRouteMap({
  camps,
  patients,
}: {
  camps: CampLocation[];
  patients: AssignedPatient[];
}) {
  const patientMarkers = useMemo(() => {
    const byArea = new Map<string, AssignedPatient[]>();
    for (const p of patients) {
      const key = (p.village || "Ahmedabad").split(/[—–-]/)[0]?.trim() || "Ahmedabad";
      const arr = byArea.get(key) || [];
      arr.push(p);
      byArea.set(key, arr);
    }
    const out: Array<{
      patient: AssignedPatient;
      position: [number, number];
    }> = [];
    for (const [, group] of byArea) {
      group.forEach((patient, i) => {
        out.push({
          patient,
          position: resolvePatientCoords(patient.village, i, group.length),
        });
      });
    }
    return out;
  }, [patients]);

  const points = useMemo(() => {
    const pts: Array<[number, number]> = [
      ...camps.map((c) => [c.lat, c.lng] as [number, number]),
      ...patientMarkers.map((m) => m.position),
    ];
    return pts.length ? pts : ([[23.0225, 72.5714]] as Array<[number, number]>);
  }, [camps, patientMarkers]);

  return (
    <div className="map-shell h-[340px] overflow-hidden rounded-3xl border border-border shadow-soft sm:h-[400px]">
      <SafeMapContainer
        center={points[0]}
        zoom={11}
        scrollWheelZoom
        className="h-full w-full rounded-3xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {camps.map((camp) => (
          <Marker
            key={camp.id}
            position={[camp.lat, camp.lng]}
            icon={campIcon}
          >
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong>Camp · {camp.name}</strong>
                <br />
                <span style={{ fontSize: 12 }}>{camp.place}</span>
                <br />
                <span style={{ fontSize: 12 }}>
                  {camp.screened} screened · {camp.status}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}
        {patientMarkers.map(({ patient, position }) => (
          <CircleMarker
            key={patient.id}
            center={position}
            radius={8}
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
                  {patient.village || "Ahmedabad"}
                  {patient.phone ? ` · ${patient.phone}` : ""}
                </span>
                <br />
                <span style={{ fontSize: 12, textTransform: "capitalize" }}>
                  Risk: {patient.risk_level || "—"}
                </span>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </SafeMapContainer>
    </div>
  );
}

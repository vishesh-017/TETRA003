import { useEffect, useMemo } from "react";
import { Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import { SafeMapContainer } from "@/components/maps/safe-map";
import type { CampLocation } from "@/modules/rural/services/camps.service";

const campIcon = L.divIcon({
  className: "healnexus-camp-pin",
  html: `<div style="
    width:32px;height:32px;border-radius:9999px;
    background:#2563EB;color:#fff;font-weight:700;font-size:14px;
    display:flex;align-items:center;justify-content:center;
    border:2px solid #fff;box-shadow:0 2px 8px rgba(15,23,42,.25);
  ">C</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (!points.length) return;
    if (points.length === 1) {
      map.setView(points[0], 7);
      return;
    }
    map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 8 });
  }, [map, points]);
  return null;
}

export function FieldCampsMap({ camps }: { camps: CampLocation[] }) {
  const points = useMemo(
    () => camps.map((c) => [c.lat, c.lng] as [number, number]),
    [camps],
  );
  const center: [number, number] = points[0] || [22.5, 73.5];

  return (
    <div className="map-shell h-[320px] overflow-hidden rounded-3xl border border-border shadow-soft sm:h-[380px]">
      <SafeMapContainer
        center={center}
        zoom={6}
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
                <strong>{camp.name}</strong>
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
      </SafeMapContainer>
    </div>
  );
}

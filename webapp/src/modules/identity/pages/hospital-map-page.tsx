import { Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";

import { SafeMapContainer } from "@/components/maps/safe-map";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { AHMEDABAD_DEMO_HOSPITALS } from "@/data/ahmedabad-hospitals";
import { cn } from "@/lib/utils";

const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export function HospitalMapPage() {
  const { user } = useAuth();
  const center: [number, number] = [23.0225, 72.5714];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            Ahmedabad Hospitals
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live map — PM-JAY empanelled and emergency centres.
          </p>
        </div>
        {user?.role === "patient" ? (
          <Link
            to="/government/pmjay"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            PM-JAY Assistant
          </Link>
        ) : null}
      </div>

      <div className="map-shell h-[420px] rounded-3xl border border-border shadow-soft">
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
          {AHMEDABAD_DEMO_HOSPITALS.map((h) => (
            <Marker
              key={h.id}
              position={[h.latitude, h.longitude]}
              icon={icon}
            >
              <Popup>
                <strong>{h.name}</strong>
                <br />
                {h.address}
                <br />
                {h.pmjay_empanelled ? "PM-JAY empanelled · " : ""}
                {h.is_emergency ? "Emergency" : "Non-emergency"}
                <br />
                <a href={`tel:${h.phone}`}>{h.phone}</a>
              </Popup>
            </Marker>
          ))}
        </SafeMapContainer>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {AHMEDABAD_DEMO_HOSPITALS.map((h) => (
          <div key={h.id} className="glass-panel rounded-3xl p-4 text-sm">
            <p className="font-medium">{h.name}</p>
            <p className="text-muted-foreground">{h.address}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {h.pmjay_empanelled ? "PM-JAY · " : ""}
              {h.is_emergency ? "Emergency" : "OPD / general"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

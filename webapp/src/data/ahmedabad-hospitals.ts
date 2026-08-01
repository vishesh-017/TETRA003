import type { DemoHospital } from "@/types/domain";

/** Ahmedabad-only demo set for Leaflet + OpenStreetMap. */
export const AHMEDABAD_DEMO_HOSPITALS: DemoHospital[] = [
  {
    id: "civil-hospital",
    name: "Civil Hospital Ahmedabad",
    hospital_type: "government",
    latitude: 23.0505,
    longitude: 72.603,
    address: "Asarwa, Ahmedabad, Gujarat",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: true,
    phone: "+91-79-22683721",
    services: [
      "Emergency & trauma",
      "Internal medicine",
      "Cardiology",
      "Dialysis",
      "PM-JAY cashless",
    ],
  },
  {
    id: "svp-hospital",
    name: "SVP Hospital (VS Hospital)",
    hospital_type: "government",
    latitude: 23.033,
    longitude: 72.566,
    address: "Ellisbridge, Ahmedabad, Gujarat",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: true,
    phone: "+91-79-26577621",
    services: [
      "Emergency",
      "Surgery",
      "Orthopaedics",
      "ICU",
      "PM-JAY cashless",
    ],
  },
  {
    id: "lg-hospital",
    name: "LG Hospital Ahmedabad",
    hospital_type: "pmjay",
    latitude: 22.9955,
    longitude: 72.6028,
    address: "Maninagar, Ahmedabad, Gujarat",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: false,
    phone: "+91-79-25462101",
    services: ["General medicine", "Maternity", "OPD", "PM-JAY cashless"],
  },
  {
    id: "shardaben-hospital",
    name: "Shardaben General Hospital",
    hospital_type: "pmjay",
    latitude: 23.0578,
    longitude: 72.5652,
    address: "Saraspur, Ahmedabad, Gujarat",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: false,
    phone: "+91-79-22165025",
    services: ["General medicine", "Paediatrics", "OPD", "PM-JAY cashless"],
  },
  {
    id: "emergency-demo",
    name: "Ahmedabad Emergency Care Demo Centre",
    hospital_type: "emergency",
    latitude: 23.0225,
    longitude: 72.5714,
    address: "CG Road area, Ahmedabad, Gujarat",
    city: "Ahmedabad",
    pmjay_empanelled: false,
    is_emergency: true,
    phone: "108",
    services: ["24×7 emergency", "Ambulance coordination", "Stabilisation"],
  },
];

/** City center reference for demo distance (km). */
export const AHMEDABAD_MAP_CENTER = {
  lat: 23.0225,
  lng: 72.5714,
} as const;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

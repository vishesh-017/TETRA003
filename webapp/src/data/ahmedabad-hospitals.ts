import type { DemoHospital } from "@/types/domain";

/** Ahmedabad hospital network for Leaflet + OpenStreetMap. */
export const AHMEDABAD_DEMO_HOSPITALS: DemoHospital[] = [
  {
    id: "civil-hospital",
    name: "Civil Hospital Ahmedabad",
    hospital_type: "government",
    latitude: 23.0505,
    longitude: 72.603,
    address: "Asarwa, Ahmedabad, Gujarat",
    area: "Asarwa",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: true,
    phone: "+91-79-22683721",
    services: ["Emergency & trauma", "Internal medicine", "Cardiology", "Dialysis"],
    pmjay_departments: [
      "Cardiology",
      "Nephrology / Dialysis",
      "General Surgery",
      "Trauma & Emergency",
      "Orthopaedics",
    ],
  },
  {
    id: "svp-hospital",
    name: "SVP Hospital (VS Hospital)",
    hospital_type: "government",
    latitude: 23.033,
    longitude: 72.566,
    address: "Ellisbridge, Ahmedabad, Gujarat",
    area: "Ellisbridge",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: true,
    phone: "+91-79-26577621",
    services: ["Emergency", "Surgery", "Orthopaedics", "ICU"],
    pmjay_departments: [
      "Emergency Medicine",
      "General Surgery",
      "Orthopaedics",
      "ICU / Critical Care",
      "Medicine",
    ],
  },
  {
    id: "lg-hospital",
    name: "LG Hospital Ahmedabad",
    hospital_type: "pmjay",
    latitude: 22.9955,
    longitude: 72.6028,
    address: "Maninagar, Ahmedabad, Gujarat",
    area: "Maninagar",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: false,
    phone: "+91-79-25462101",
    services: ["General medicine", "Maternity", "OPD"],
    pmjay_departments: ["General Medicine", "Maternity / Obstetrics", "OPD packages"],
  },
  {
    id: "shardaben-hospital",
    name: "Shardaben General Hospital",
    hospital_type: "pmjay",
    latitude: 23.0578,
    longitude: 72.5652,
    address: "Saraspur, Ahmedabad, Gujarat",
    area: "Saraspur",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: false,
    phone: "+91-79-22165025",
    services: ["General medicine", "Paediatrics", "OPD"],
    pmjay_departments: ["Paediatrics", "General Medicine", "OPD packages"],
  },
  {
    id: "unjha-hospital",
    name: "Unjha Super Specialty Hospital",
    hospital_type: "pmjay",
    latitude: 23.0412,
    longitude: 72.512,
    address: "Sola Road, Ahmedabad, Gujarat",
    area: "Sola",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: true,
    phone: "+91-79-40001234",
    services: ["Cardiology", "Oncology", "Neurology", "Emergency"],
    pmjay_departments: [
      "Cardiology",
      "Oncology",
      "Neurology",
      "Neurosurgery",
      "Emergency",
    ],
  },
  {
    id: "sterling-hospital",
    name: "Sterling Hospitals Ahmedabad",
    hospital_type: "private",
    latitude: 23.0388,
    longitude: 72.528,
    address: "Memnagar, Ahmedabad, Gujarat",
    area: "Memnagar",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: true,
    phone: "+91-79-40011111",
    services: ["Multi-specialty", "ICU", "Cardiac care"],
    pmjay_departments: ["Cardiology", "Cardiac Surgery", "ICU", "Orthopaedics"],
  },
  {
    id: "zydus-hospital",
    name: "Zydus Hospitals",
    hospital_type: "private",
    latitude: 23.0705,
    longitude: 72.5165,
    address: "Thaltej, Ahmedabad, Gujarat",
    area: "Thaltej",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: true,
    phone: "+91-79-66112233",
    services: ["Tertiary care", "Transplant", "Emergency"],
    pmjay_departments: [
      "Gastroenterology",
      "Transplant packages",
      "Emergency",
      "Critical Care",
    ],
  },
  {
    id: "cims-hospital",
    name: "CIMS Hospital",
    hospital_type: "private",
    latitude: 23.046,
    longitude: 72.508,
    address: "Science City Road, Ahmedabad, Gujarat",
    area: "Science City",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: true,
    phone: "+91-79-27712222",
    services: ["Cardiac sciences", "Critical care"],
    pmjay_departments: ["Cardiology", "Cardiac Surgery", "ICU"],
  },
  {
    id: "apollo-ahmedabad",
    name: "Apollo Hospitals International",
    hospital_type: "private",
    latitude: 23.072,
    longitude: 72.495,
    address: "Bhat, Gandhinagar Road, Ahmedabad",
    area: "Bhat",
    city: "Ahmedabad",
    pmjay_empanelled: true,
    is_emergency: true,
    phone: "+91-79-66701800",
    services: ["Multi-specialty tertiary", "Emergency"],
    pmjay_departments: [
      "Oncology",
      "Cardiology",
      "Neurosciences",
      "Emergency",
    ],
  },
  {
    id: "emergency-live",
    name: "Ahmedabad Emergency Care Centre",
    hospital_type: "emergency",
    latitude: 23.0225,
    longitude: 72.5714,
    address: "CG Road area, Ahmedabad, Gujarat",
    area: "CG Road",
    city: "Ahmedabad",
    pmjay_empanelled: false,
    is_emergency: true,
    phone: "108",
    services: ["24×7 emergency", "Ambulance coordination", "Stabilisation"],
    pmjay_departments: [],
  },
];

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

export function hospitalPinColor(h: DemoHospital): string {
  if (h.hospital_type === "emergency" || (h.is_emergency && !h.pmjay_empanelled))
    return "#EF4444";
  if (h.hospital_type === "government") return "#2563EB";
  if (h.pmjay_empanelled) return "#14B8A6";
  return "#64748B";
}

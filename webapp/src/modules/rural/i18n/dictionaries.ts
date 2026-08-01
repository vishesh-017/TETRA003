import type { RuralLocale } from "@/modules/rural/types";
import gu from "./gu.json";
import hi from "./hi.json";

const en = {
  appName: "Rural Care",
  dashboard: "Home",
  screening: "Screening",
  patients: "Patients",
  sync: "Sync",
  education: "Education",
  visits: "Visits",
  notifications: "Alerts",
  patientsAssigned: "Patients assigned",
  visitsDue: "Home visits due",
  highRisk: "High risk patients",
  pendingSync: "Pending sync",
  startScreening: "Start screening",
  viewPatients: "View patients",
  syncData: "Sync offline data",
  emergencyAlert: "Emergency alert",
  online: "Online",
  offline: "Offline — data saved on this phone",
  saveOffline: "Save on this phone",
  selectPatient: "Select patient",
  registerPatient: "Register new patient",
  bloodPressure: "Blood pressure",
  bloodSugar: "Blood sugar",
  temperature: "Temperature",
  weight: "Weight",
  oxygen: "Oxygen",
  symptoms: "Symptoms",
  medicineTaken: "Medicine taken?",
  painLevel: "Pain level",
  notes: "Notes",
  submit: "Save screening",
  syncNow: "Sync now",
  pending: "Pending",
  syncing: "Syncing",
  synced: "Synced",
  failed: "Failed",
  todayVisits: "Today's visits",
  completedVisits: "Completed",
  upcomingVisits: "Upcoming",
  missedVisits: "Missed",
  markComplete: "Mark complete",
  language: "Language",
  savedLocally: "Saved on this phone. Will sync when internet is available.",
  emergencyDetected: "Emergency signs found",
  notifyDoctor: "Doctor and caregiver will be notified on sync",
  back: "Back",
  name: "Name",
  phone: "Phone",
  village: "Village",
  yes: "Yes",
  no: "No",
  tips: "Health tips",
} as const;

export type DictKey = keyof typeof en;

export const DICTIONARIES: Record<RuralLocale, Record<DictKey, string>> = {
  en: { ...en },
  hi: hi as Record<DictKey, string>,
  gu: gu as Record<DictKey, string>,
};

export const LOCALE_LABELS: Record<RuralLocale, string> = {
  en: "English",
  hi: "Hindi",
  gu: "Gujarati",
};

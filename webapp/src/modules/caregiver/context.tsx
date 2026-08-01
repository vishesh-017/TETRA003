import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/contexts/auth-context";
import { IDS, subscribeStore } from "@/data/store";

import {
  buildCaregiverWorkspace,
  type CaregiverWorkspace,
} from "./arrangement-builder";
import type {
  ActivityItem,
  AiCareInsight,
  CareAppointment,
  CareTimelineItem,
  DoctorMessage,
  EducationTip,
  FamilyMember,
  HealthInsight,
  MedicineDose,
  PassportPreviewData,
  SmartAlert,
} from "./types";
import { CAREGIVER_DEMO } from "./data";

interface CaregiverContextValue {
  caregiverName: string;
  family: FamilyMember[];
  selectedId: string;
  selected: FamilyMember;
  selectMember: (id: string) => void;
  timeline: CareTimelineItem[];
  insights: HealthInsight[];
  doctorMessages: DoctorMessage[];
  alerts: SmartAlert[];
  medicines: MedicineDose[];
  appointments: CareAppointment[];
  passport: PassportPreviewData;
  aiInsight: AiCareInsight;
  education: EducationTip[];
  activity: ActivityItem[];
  emergency: typeof CAREGIVER_DEMO.emergency;
  allAlerts: SmartAlert[];
  source: CaregiverWorkspace["source"];
  arrangementCount: number;
}

const CaregiverContext = createContext<CaregiverContextValue | null>(null);

export function CaregiverProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const caregiverUserId = user?.id || IDS.caregiverUser;
  const [workspace, setWorkspace] = useState(() =>
    buildCaregiverWorkspace(caregiverUserId),
  );
  const [selectedId, setSelectedId] = useState(
    () => buildCaregiverWorkspace(caregiverUserId).members[0]?.member.id ?? "",
  );

  useEffect(() => {
    const refresh = () => {
      const next = buildCaregiverWorkspace(caregiverUserId);
      setWorkspace(next);
      setSelectedId((prev) =>
        next.members.some((m) => m.member.id === prev)
          ? prev
          : (next.members[0]?.member.id ?? ""),
      );
    };
    refresh();
    return subscribeStore(refresh);
  }, [caregiverUserId]);

  const selectMember = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const value = useMemo<CaregiverContextValue>(() => {
    const selectedBundle =
      workspace.members.find((m) => m.member.id === selectedId) ??
      workspace.members[0];

    const selected = selectedBundle?.member ?? CAREGIVER_DEMO.family[0]!;
    const allAlerts = workspace.members.flatMap((m) =>
      m.alerts.map((a) => ({
        ...a,
        title: `${a.title} · ${m.member.shortLabel}`,
      })),
    );

    return {
      caregiverName: workspace.caregiverName,
      family: workspace.members.map((m) => m.member),
      selectedId: selected.id,
      selected,
      selectMember,
      timeline: selectedBundle?.timeline ?? [],
      insights: selectedBundle?.insights ?? [],
      doctorMessages: selectedBundle?.doctorMessages ?? [],
      alerts: selectedBundle?.alerts ?? [],
      medicines: selectedBundle?.medicines ?? [],
      appointments: selectedBundle?.appointments ?? [],
      passport: selectedBundle?.passport ?? CAREGIVER_DEMO.passports.ramesh!,
      aiInsight: selectedBundle?.aiInsight ?? CAREGIVER_DEMO.aiInsights.ramesh!,
      education: workspace.education,
      activity: selectedBundle?.activity ?? [],
      emergency: workspace.emergency,
      allAlerts,
      source: workspace.source,
      arrangementCount: workspace.members.length,
    };
  }, [workspace, selectedId, selectMember]);

  return (
    <CaregiverContext.Provider value={value}>
      {children}
    </CaregiverContext.Provider>
  );
}

export function useCaregiver() {
  const ctx = useContext(CaregiverContext);
  if (!ctx) {
    throw new Error("useCaregiver must be used within CaregiverProvider");
  }
  return ctx;
}

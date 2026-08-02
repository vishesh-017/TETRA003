import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Button } from "@/components/ui/button";

import type { CaregiverWorkspaceMember } from "./arrangement-builder";
import {
  useCaregiverMutations,
  useCaregiverWorkspace,
} from "./hooks";
import type {
  ActivityItem,
  AiCareInsight,
  CareAppointment,
  CaregiverCarePlanSupport,
  CaregiverEmergencyContacts,
  CareTimelineItem,
  DoctorMessage,
  EducationTip,
  FamilyHealthSummary,
  FamilyMember,
  HealthInsight,
  MedicineDose,
  PassportPreviewData,
  SmartAlert,
} from "./types";

interface CaregiverContextValue {
  caregiverName: string;
  caregiverUserId: string;
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
  carePlan: CaregiverCarePlanSupport | null;
  emergency: CaregiverEmergencyContacts;
  familySummary: FamilyHealthSummary;
  trendSeries: Array<{
    day: string;
    score: number;
    sugar?: number | null;
    bp?: number | null;
  }>;
  allAlerts: SmartAlert[];
  source: "live" | "empty";
  arrangementCount: number;
  markMedicine: ReturnType<typeof useCaregiverMutations>["markMedicine"];
  appointmentAction: ReturnType<
    typeof useCaregiverMutations
  >["appointmentAction"];
}

const CaregiverContext = createContext<CaregiverContextValue | null>(null);

const EMPTY_PASSPORT: PassportPreviewData = {
  name: "—",
  bloodGroup: "—",
  allergies: [],
  medicines: [],
  emergencyContact: "—",
  emergencyPhone: "—",
  qrValue: "HN-EMPTY",
  abhaId: "—",
};

const EMPTY_MEMBER: FamilyMember = {
  id: "",
  userId: "",
  name: "No patient assigned",
  relationship: "—",
  shortLabel: "—",
  age: 0,
  avatarEmoji: "👤",
  recoveryScore: 0,
  riskLevel: "low",
  progression: "low",
  status: "stable",
  statusLabel: "Unassigned",
  todayProgress: 0,
  vitals: [],
  medicineAdherence: 0,
  trend: "stable",
  trendLabel: "—",
  nextAppointment: "None",
  bloodGroup: "—",
  allergies: [],
  emergencyContact: { name: "—", phone: "108", relationship: "—" },
  doctorName: "—",
  hospital: "—",
  conditionSummary: "Ask a patient to invite you from Profile → My caregivers.",
  pmjayStatus: "—",
  abhaId: "—",
};

export function CaregiverProvider({ children }: { children: ReactNode }) {
  const workspaceQuery = useCaregiverWorkspace();
  const mutations = useCaregiverMutations();
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const members = workspaceQuery.data?.members ?? [];
    if (!members.length) {
      setSelectedId("");
      return;
    }
    setSelectedId((prev) =>
      members.some((m) => m.member.id === prev)
        ? prev
        : members[0]!.member.id,
    );
  }, [workspaceQuery.data?.members]);

  const selectMember = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const value = useMemo<CaregiverContextValue | null>(() => {
    if (!workspaceQuery.data) return null;
    const workspace = workspaceQuery.data;
    const selectedBundle: CaregiverWorkspaceMember | undefined =
      workspace.members.find((m) => m.member.id === selectedId) ??
      workspace.members[0];

    const selected = selectedBundle?.member ?? EMPTY_MEMBER;
    const allAlerts = workspace.members.flatMap((m) =>
      m.alerts.map((a) => ({
        ...a,
        title: `${a.title} · ${m.member.shortLabel}`,
      })),
    );

    return {
      caregiverName: workspace.caregiverName,
      caregiverUserId: workspace.caregiverUserId,
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
      passport: selectedBundle?.passport ?? EMPTY_PASSPORT,
      aiInsight: selectedBundle?.aiInsight ?? {
        summary: "No live patient selected.",
        bullets: [],
      },
      education: selectedBundle?.education ?? workspace.education,
      activity: selectedBundle?.activity ?? [],
      carePlan: selectedBundle?.carePlan ?? null,
      emergency: selectedBundle?.emergency ?? workspace.emergency,
      familySummary: workspace.familySummary,
      trendSeries: selectedBundle?.trendSeries ?? [],
      allAlerts,
      source: workspace.source,
      arrangementCount: workspace.members.length,
      markMedicine: mutations.markMedicine,
      appointmentAction: mutations.appointmentAction,
    };
  }, [
    workspaceQuery.data,
    selectedId,
    selectMember,
    mutations.markMedicine,
    mutations.appointmentAction,
  ]);

  if (workspaceQuery.isLoading) {
    return <LoadingScreen label="Loading family care workspace…" />;
  }

  if (workspaceQuery.isError || !value) {
    return (
      <ErrorState
        title="Could not load caregiver workspace"
        description={
          workspaceQuery.error instanceof Error
            ? workspaceQuery.error.message
            : "Try again in a moment."
        }
        onRetry={() => void workspaceQuery.refetch()}
      />
    );
  }

  if (value.source === "empty") {
    return (
      <CaregiverContext.Provider value={value}>
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Caregiver Dashboard
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            No patients assigned yet
          </h1>
          <p className="text-muted-foreground">
            Patients invite caregivers from Profile → My caregivers. After you
            accept an invite code at login, their live recovery data appears
            here automatically.
          </p>
          <Button variant="secondary" onClick={() => void workspaceQuery.refetch()}>
            Refresh
          </Button>
        </div>
      </CaregiverContext.Provider>
    );
  }

  return (
    <CaregiverContext.Provider value={value}>{children}</CaregiverContext.Provider>
  );
}

export function useCaregiver() {
  const ctx = useContext(CaregiverContext);
  if (!ctx) {
    throw new Error("useCaregiver must be used within CaregiverProvider");
  }
  return ctx;
}

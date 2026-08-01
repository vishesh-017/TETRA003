import {
  getStore,
  IDS,
  todayKey,
  updateStore,
} from "@/data/store";
import { countPendingSync } from "@/modules/rural/offline/storage";
import { isOnline } from "@/modules/rural/offline/sync-engine";
import type {
  AssignedPatient,
  RuralDashboardStats,
  VisitView,
} from "@/modules/rural/types";

function hwId(userId: string): string {
  const store = getStore();
  const hw =
    store.healthWorkers?.find((h) => h.user_id === userId) ||
    store.healthWorkers?.[0];
  return hw?.id ?? IDS.healthWorker;
}

export const ruralRepository = {
  resolveHealthWorkerId: hwId,

  async getDashboard(userId: string): Promise<RuralDashboardStats> {
    const store = getStore();
    const workerId = hwId(userId);
    const today = todayKey();
    const assigned = (store.healthWorkerAssignments ?? []).filter(
      (a) => a.health_worker_id === workerId,
    );
    const patientIds = assigned.map((a) => a.patient_id);
    const visitsDue = (store.homeVisits ?? []).filter(
      (v) =>
        v.health_worker_id === workerId &&
        v.scheduled_for === today &&
        (v.status === "due" || v.status === "upcoming"),
    ).length;
    const highRisk = store.risks.filter(
      (r) =>
        patientIds.includes(r.patient_id) &&
        (r.level === "high" || r.level === "critical"),
    ).length;

    return {
      patients_assigned_today: patientIds.length,
      home_visits_due: visitsDue,
      high_risk_patients: highRisk,
      pending_sync: await countPendingSync(),
      online: isOnline(),
    };
  },

  listAssignedPatients(userId: string): AssignedPatient[] {
    const store = getStore();
    const workerId = hwId(userId);
    const ids = (store.healthWorkerAssignments ?? [])
      .filter((a) => a.health_worker_id === workerId)
      .map((a) => a.patient_id);

    return ids.map((pid) => {
      const patient = store.patients.find((p) => p.id === pid)!;
      const profile = store.profiles.find((p) => p.id === patient.user_id);
      return {
        id: patient.id,
        full_name: profile?.full_name ?? "Patient",
        village:
          (patient.address?.village as string | undefined) ||
          (patient.address?.city as string | undefined) ||
          null,
        phone: profile?.phone ?? null,
        risk_level:
          store.risks.find((r) => r.patient_id === pid)?.level ?? null,
        recovery_score:
          store.recoveryScores.find((r) => r.patient_id === pid)?.score ?? null,
        blood_group: patient.blood_group,
        conditions: patient.chronic_diseases,
      };
    });
  },

  listVisits(userId: string): VisitView[] {
    const store = getStore();
    const workerId = hwId(userId);
    return (store.homeVisits ?? [])
      .filter((v) => v.health_worker_id === workerId)
      .map((v) => {
        const patient = store.patients.find((p) => p.id === v.patient_id);
        const profile = store.profiles.find((p) => p.id === patient?.user_id);
        // Auto-mark past due as missed for display if still due
        let status = v.status;
        const today = todayKey();
        if (status === "due" && v.scheduled_for < today) status = "missed";
        if (status === "upcoming" && v.scheduled_for === today) status = "due";
        return {
          id: v.id,
          patient_id: v.patient_id,
          patient_name: profile?.full_name ?? "Patient",
          scheduled_for: v.scheduled_for,
          status,
          notes: v.notes,
          village: v.village,
          completed_at: v.completed_at,
        };
      })
      .sort((a, b) => b.scheduled_for.localeCompare(a.scheduled_for));
  },

  completeVisit(visitId: string, notes?: string) {
    updateStore((draft) => {
      const visit = (draft.homeVisits ?? []).find((v) => v.id === visitId);
      if (!visit) return;
      visit.status = "completed";
      visit.completed_at = new Date().toISOString();
      if (notes) visit.notes = notes;
    });
    return this.listVisits(IDS.healthWorkerUser);
  },

  registerOfflinePatient(input: {
    full_name: string;
    phone?: string;
    village?: string;
  }) {
    // Creates a lightweight patient in the main store so screenings can link.
    // Works offline via local store; syncs when connectivity returns.
    let patientId = "";
    updateStore((draft) => {
      const userId = newOfflineUserId();
      patientId = newOfflineUserId();
      draft.profiles.push({
        id: userId,
        email: null,
        full_name: input.full_name,
        phone: input.phone ?? null,
        role: "patient",
        locale: "gu",
        username:
          input.full_name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ".")
            .replace(/^\.|\.$/g, "")
            .slice(0, 24) || `patient.${userId.slice(-4)}`,
        address: { village: input.village ?? "Village", city: "Ahmedabad" },
        notification_prefs: {
          medicine: true,
          appointment: true,
          tips: true,
          doctor_messages: true,
        },
      });
      draft.patients.push({
        id: patientId,
        user_id: userId,
        date_of_birth: null,
        sex: null,
        blood_group: null,
        abha_id_demo: null,
        address: { village: input.village ?? "Village" },
        chronic_diseases: [],
        allergies: [],
        medical_history: "Registered via rural screening (offline)",
        emergency_contact: null,
        caregiver_info: null,
        preferred_language: "gu",
        status: "active",
        is_archived: false,
        created_at: new Date().toISOString(),
      });
      draft.healthWorkerAssignments = draft.healthWorkerAssignments ?? [];
      draft.healthWorkerAssignments.push({
        health_worker_id: IDS.healthWorker,
        patient_id: patientId,
      });
      draft.relationships.push({
        doctor_id: IDS.doctor,
        patient_id: patientId,
        status: "active",
      });
    });
    return patientId;
  },
};

function newOfflineUserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0")}`;
}

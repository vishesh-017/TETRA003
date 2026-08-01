import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import { invalidateCareGraph } from "@/lib/care-graph";
import { queryKeys } from "@/lib/query-keys";
import { doctorApi } from "@/modules/doctor/api";

export function useDoctorToken() {
  const { accessToken } = useAuth();
  return accessToken;
}

export function useDoctorDashboard() {
  const token = useDoctorToken();
  return useQuery({
    queryKey: ["doctor", "dashboard"],
    queryFn: () => doctorApi.dashboard(token),
    enabled: Boolean(token),
  });
}

export function useDoctorPatients(filters: {
  search?: string;
  status?: string;
  include_archived?: boolean;
}) {
  const token = useDoctorToken();
  return useQuery({
    queryKey: [...queryKeys.patients.all, filters],
    queryFn: () => doctorApi.listPatients(token, filters),
    enabled: Boolean(token),
  });
}

export function useDoctorPatient(patientId?: string) {
  const token = useDoctorToken();
  return useQuery({
    queryKey: queryKeys.patients.detail(patientId || "unknown"),
    queryFn: () => doctorApi.getPatient(token, patientId!),
    enabled: Boolean(token && patientId),
  });
}

export function useHighRiskPatients(sortBy = "recovery_score", minRisk?: string) {
  const token = useDoctorToken();
  return useQuery({
    queryKey: ["doctor", "high-risk", sortBy, minRisk],
    queryFn: () =>
      doctorApi.highRisk(token, { sort_by: sortBy, min_risk: minRisk }),
    enabled: Boolean(token),
  });
}

export function usePatientDischarges(patientId?: string) {
  const token = useDoctorToken();
  return useQuery({
    queryKey: ["doctor", "discharges", patientId],
    queryFn: () => doctorApi.listDischarges(token, patientId!),
    enabled: Boolean(token && patientId),
  });
}

export function usePatientCarePlans(patientId?: string) {
  const token = useDoctorToken();
  return useQuery({
    queryKey: ["doctor", "care-plans", patientId],
    queryFn: () => doctorApi.listCarePlans(token, patientId!),
    enabled: Boolean(token && patientId),
  });
}

export function usePatientCheckins(patientId?: string) {
  const token = useDoctorToken();
  return useQuery({
    queryKey: ["doctor", "checkins", patientId],
    queryFn: () => doctorApi.listCheckins(token, patientId!),
    enabled: Boolean(token && patientId),
  });
}

export function usePatientMedicines(patientId?: string) {
  const token = useDoctorToken();
  return useQuery({
    queryKey: ["doctor", "medicines", patientId],
    queryFn: () => doctorApi.listMedicines(token, patientId!),
    enabled: Boolean(token && patientId),
  });
}

export function useDoctorAppointments(params?: {
  status?: string;
  patient_id?: string;
}) {
  const token = useDoctorToken();
  return useQuery({
    queryKey: ["doctor", "appointments", params],
    queryFn: () => doctorApi.listAppointments(token, params),
    enabled: Boolean(token),
  });
}

export function useDoctorMutations() {
  const token = useDoctorToken();
  const qc = useQueryClient();

  const createPatient = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      doctorApi.createPatient(token, body),
    onSuccess: async (patient) => {
      toast.success("Patient linked to your panel");
      await invalidateCareGraph(qc, { patientId: patient.id });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updatePatient = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      doctorApi.updatePatient(token, id, body),
    onSuccess: async (_data, vars) => {
      toast.success("Patient updated");
      await invalidateCareGraph(qc, { patientId: vars.id });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const archivePatient = useMutation({
    mutationFn: (id: string) => doctorApi.archivePatient(token, id),
    onSuccess: async (_data, id) => {
      toast.success("Patient archived");
      await invalidateCareGraph(qc, { patientId: id });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveDischarge = useMutation({
    mutationFn: ({
      patientId,
      dischargeId,
      body,
    }: {
      patientId: string;
      dischargeId?: string;
      body: Record<string, unknown>;
    }) =>
      dischargeId
        ? doctorApi.updateDischarge(token, dischargeId, body)
        : doctorApi.createDischarge(token, patientId, body),
    onSuccess: async (_data, vars) => {
      toast.success("Discharge draft saved");
      await invalidateCareGraph(qc, { patientId: vars.patientId });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const finalizeDischarge = useMutation({
    mutationFn: ({
      dischargeId,
    }: {
      dischargeId: string;
      patientId: string;
    }) => doctorApi.finalizeDischarge(token, dischargeId),
    onMutate: async () => {
      toast.message("Generating AI Recovery Plan…");
    },
    onSuccess: async (_data, vars) => {
      toast.success("AI Care Companion draft ready for review");
      await invalidateCareGraph(qc, { patientId: vars.patientId });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateCarePlanDraft = useMutation({
    mutationFn: ({
      carePlanId,
      body,
    }: {
      carePlanId: string;
      patientId: string;
      body: Record<string, unknown>;
    }) => doctorApi.updateCarePlanDraft(token, carePlanId, body),
    onSuccess: async (_data, vars) => {
      toast.success("Draft updates saved");
      await invalidateCareGraph(qc, { patientId: vars.patientId });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rejectCarePlan = useMutation({
    mutationFn: ({
      carePlanId,
      body,
    }: {
      carePlanId: string;
      patientId: string;
      body?: Record<string, unknown>;
    }) => doctorApi.rejectCarePlan(token, carePlanId, body),
    onSuccess: async (_data, vars) => {
      toast.message("AI draft rejected — not published to patient");
      await invalidateCareGraph(qc, { patientId: vars.patientId });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const approveCarePlan = useMutation({
    mutationFn: ({
      carePlanId,
      body,
    }: {
      carePlanId: string;
      patientId: string;
      body: Record<string, unknown>;
    }) => doctorApi.approveCarePlan(token, carePlanId, body),
    onSuccess: async (_data, vars) => {
      toast.success("Recovery plan published to patient & caregiver");
      await invalidateCareGraph(qc, { patientId: vars.patientId });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const refreshAiSummary = useMutation({
    mutationFn: (id: string) => doctorApi.aiSummary(token, id),
    onSuccess: async (_data, id) => {
      toast.success("AI summary refreshed");
      await invalidateCareGraph(qc, { patientId: id });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createAppointment = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      doctorApi.createAppointment(token, body),
    onSuccess: async (_data, body) => {
      toast.success("Appointment scheduled");
      await invalidateCareGraph(qc, {
        patientId: body.patient_id as string | undefined,
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateAppointment = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      doctorApi.updateAppointment(token, id, body),
    onSuccess: async () => {
      toast.success("Appointment updated");
      await invalidateCareGraph(qc);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cancelAppointment = useMutation({
    mutationFn: (id: string) => doctorApi.cancelAppointment(token, id),
    onSuccess: async () => {
      toast.success("Appointment cancelled");
      await invalidateCareGraph(qc);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    createPatient,
    updatePatient,
    archivePatient,
    saveDischarge,
    finalizeDischarge,
    updateCarePlanDraft,
    rejectCarePlan,
    approveCarePlan,
    refreshAiSummary,
    createAppointment,
    updateAppointment,
    cancelAppointment,
  };
}

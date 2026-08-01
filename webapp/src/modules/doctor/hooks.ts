import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import { doctorApi } from "@/modules/doctor/api";
import { queryKeys } from "@/lib/query-keys";

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

  const invalidatePatients = async () => {
    await qc.invalidateQueries({ queryKey: queryKeys.patients.all });
    await qc.invalidateQueries({ queryKey: ["doctor"] });
  };

  const createPatient = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      doctorApi.createPatient(token, body),
    onSuccess: async () => {
      toast.success("Patient added");
      await invalidatePatients();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updatePatient = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      doctorApi.updatePatient(token, id, body),
    onSuccess: async (_data, vars) => {
      toast.success("Patient updated");
      await qc.invalidateQueries({ queryKey: queryKeys.patients.detail(vars.id) });
      await invalidatePatients();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const archivePatient = useMutation({
    mutationFn: (id: string) => doctorApi.archivePatient(token, id),
    onSuccess: async () => {
      toast.success("Patient archived");
      await invalidatePatients();
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
      await qc.invalidateQueries({
        queryKey: ["doctor", "discharges", vars.patientId],
      });
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
    onSuccess: async (_data, vars) => {
      toast.success("Discharge finalized — AI Care Companion draft ready");
      await qc.invalidateQueries({
        queryKey: ["doctor", "discharges", vars.patientId],
      });
      await qc.invalidateQueries({
        queryKey: ["doctor", "care-plans", vars.patientId],
      });
      await qc.invalidateQueries({
        queryKey: queryKeys.patients.detail(vars.patientId),
      });
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
      toast.success("Care plan approved and published");
      await qc.invalidateQueries({
        queryKey: ["doctor", "care-plans", vars.patientId],
      });
      await qc.invalidateQueries({
        queryKey: ["doctor", "medicines", vars.patientId],
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const refreshAiSummary = useMutation({
    mutationFn: (id: string) => doctorApi.aiSummary(token, id),
    onSuccess: async (_data, id) => {
      toast.success("AI summary refreshed");
      await qc.invalidateQueries({
        queryKey: queryKeys.patients.detail(id),
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const createAppointment = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      doctorApi.createAppointment(token, body),
    onSuccess: async () => {
      toast.success("Appointment scheduled");
      await qc.invalidateQueries({ queryKey: ["doctor", "appointments"] });
      await qc.invalidateQueries({ queryKey: ["doctor", "dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateAppointment = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      doctorApi.updateAppointment(token, id, body),
    onSuccess: async () => {
      toast.success("Appointment updated");
      await qc.invalidateQueries({ queryKey: ["doctor", "appointments"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cancelAppointment = useMutation({
    mutationFn: (id: string) => doctorApi.cancelAppointment(token, id),
    onSuccess: async () => {
      toast.success("Appointment cancelled");
      await qc.invalidateQueries({ queryKey: ["doctor", "appointments"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return {
    createPatient,
    updatePatient,
    archivePatient,
    saveDischarge,
    finalizeDischarge,
    approveCarePlan,
    refreshAiSummary,
    createAppointment,
    updateAppointment,
    cancelAppointment,
  };
}

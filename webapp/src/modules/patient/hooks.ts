import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import type { TaskStatus } from "@/data/store";

import { patientRepository } from "./repository";
import type { CheckInInput } from "./types";

const keys = {
  today: (uid: string) => ["patient", "today", uid] as const,
  carePlan: (uid: string) => ["patient", "care-plan", uid] as const,
  medicines: (uid: string) => ["patient", "medicines", uid] as const,
  appointments: (uid: string) => ["patient", "appointments", uid] as const,
  passport: (uid: string) => ["patient", "passport", uid] as const,
  notifications: (uid: string) => ["patient", "notifications", uid] as const,
  profile: (uid: string) => ["patient", "profile", uid] as const,
  recovery: (uid: string) => ["patient", "recovery", uid] as const,
};

function usePatientUserId() {
  const { user } = useAuth();
  return user?.id ?? "";
}

export function useTodayDashboard() {
  const userId = usePatientUserId();
  return useQuery({
    queryKey: keys.today(userId),
    queryFn: () => patientRepository.getTodayDashboard(userId),
    enabled: Boolean(userId),
  });
}

export function useCarePlanTimeline() {
  const userId = usePatientUserId();
  return useQuery({
    queryKey: keys.carePlan(userId),
    queryFn: () => patientRepository.getCarePlanTimeline(userId),
    enabled: Boolean(userId),
  });
}

export function usePatientMedicines() {
  const userId = usePatientUserId();
  return useQuery({
    queryKey: keys.medicines(userId),
    queryFn: () => patientRepository.listMedicines(userId),
    enabled: Boolean(userId),
  });
}

export function usePatientAppointments() {
  const userId = usePatientUserId();
  return useQuery({
    queryKey: keys.appointments(userId),
    queryFn: () => patientRepository.listAppointments(userId),
    enabled: Boolean(userId),
  });
}

export function usePatientPassport() {
  const userId = usePatientUserId();
  return useQuery({
    queryKey: keys.passport(userId),
    queryFn: () => patientRepository.getPassport(userId),
    enabled: Boolean(userId),
  });
}

export function usePatientNotifications() {
  const userId = usePatientUserId();
  return useQuery({
    queryKey: keys.notifications(userId),
    queryFn: () => patientRepository.listNotifications(userId),
    enabled: Boolean(userId),
  });
}

export function usePatientProfile() {
  const userId = usePatientUserId();
  return useQuery({
    queryKey: keys.profile(userId),
    queryFn: () => patientRepository.getProfile(userId),
    enabled: Boolean(userId),
  });
}

export function usePatientRecovery() {
  const userId = usePatientUserId();
  return useQuery({
    queryKey: keys.recovery(userId),
    queryFn: () => patientRepository.getRecovery(userId),
    enabled: Boolean(userId),
  });
}

export function usePatientMutations() {
  const userId = usePatientUserId();
  const qc = useQueryClient();

  const invalidateAll = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["patient"] }),
    ]);
  };

  const setTaskStatus = useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: TaskStatus;
    }) => patientRepository.setTaskStatus(userId, taskId, status),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Task updated");
    },
  });

  const markMedicine = useMutation({
    mutationFn: ({
      medicineId,
      status,
    }: {
      medicineId: string;
      status: "taken" | "skipped";
    }) => patientRepository.markMedicine(userId, medicineId, status),
    onSuccess: async (_, vars) => {
      await invalidateAll();
      toast.success(vars.status === "taken" ? "Marked as taken" : "Marked as skipped");
    },
  });

  const appointmentAction = useMutation({
    mutationFn: ({
      appointmentId,
      action,
    }: {
      appointmentId: string;
      action: "reschedule" | "cancel";
    }) =>
      patientRepository.requestAppointmentAction(
        userId,
        appointmentId,
        action,
      ),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Request sent to your care team");
    },
  });

  const submitCheckIn = useMutation({
    mutationFn: (input: CheckInInput) =>
      patientRepository.submitCheckIn(userId, input),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Great! Your health log has been recorded.");
    },
  });

  const markNotificationRead = useMutation({
    mutationFn: (id: string) =>
      patientRepository.markNotificationRead(userId, id),
    onSuccess: () => invalidateAll(),
  });

  const markAllRead = useMutation({
    mutationFn: () => patientRepository.markAllNotificationsRead(userId),
    onSuccess: () => invalidateAll(),
  });

  const updateProfile = useMutation({
    mutationFn: patientRepository.updateProfile.bind(null, userId),
    onSuccess: async () => {
      await invalidateAll();
      toast.success("Profile updated");
    },
  });

  return {
    setTaskStatus,
    markMedicine,
    appointmentAction,
    submitCheckIn,
    markNotificationRead,
    markAllRead,
    updateProfile,
  };
}

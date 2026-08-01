import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import { IDS, subscribeStore } from "@/data/store";
import { invalidateCareGraph } from "@/lib/care-graph";
import { getSupabaseClient } from "@/lib/supabase";

import { caregiverRepository } from "./repository";

export const caregiverKeys = {
  all: ["caregiver"] as const,
  workspace: (uid: string) => ["caregiver", "workspace", uid] as const,
  prefs: (uid: string) => ["caregiver", "prefs", uid] as const,
};

function useCaregiverUserId() {
  const { user } = useAuth();
  return user?.id || IDS.caregiverUser;
}

export function useInvalidateCaregiverOnStore() {
  const qc = useQueryClient();
  useEffect(() => {
    return subscribeStore(() => {
      void qc.invalidateQueries({ queryKey: caregiverKeys.all });
      void qc.invalidateQueries({ queryKey: ["patient"] });
    });
  }, [qc]);
}

/** Supabase Realtime + local store — keep caregiver dashboard synchronized. */
export function useCaregiverRealtime() {
  const qc = useQueryClient();
  useInvalidateCaregiverOnStore();

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel("caregiver-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {
          void qc.invalidateQueries({ queryKey: caregiverKeys.all });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          void qc.invalidateQueries({ queryKey: caregiverKeys.all });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recovery_scores" },
        () => {
          void qc.invalidateQueries({ queryKey: caregiverKeys.all });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_completions" },
        () => {
          void qc.invalidateQueries({ queryKey: caregiverKeys.all });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "medicine_events" },
        () => {
          void qc.invalidateQueries({ queryKey: caregiverKeys.all });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkins" },
        () => {
          void qc.invalidateQueries({ queryKey: caregiverKeys.all });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useCaregiverWorkspace() {
  const userId = useCaregiverUserId();
  useCaregiverRealtime();
  return useQuery({
    queryKey: caregiverKeys.workspace(userId),
    queryFn: () => caregiverRepository.getWorkspace(userId),
    enabled: Boolean(userId),
  });
}

export function useCaregiverPrefs() {
  const userId = useCaregiverUserId();
  return useQuery({
    queryKey: caregiverKeys.prefs(userId),
    queryFn: () => caregiverRepository.getNotificationPrefs(userId),
    enabled: Boolean(userId),
  });
}

export function useCaregiverMutations() {
  const userId = useCaregiverUserId();
  const qc = useQueryClient();

  const markMedicine = useMutation({
    mutationFn: (vars: {
      patientUserId: string;
      medicineId: string;
      status: "taken" | "skipped";
    }) =>
      caregiverRepository.markMedicineForPatient(
        vars.patientUserId,
        vars.medicineId,
        vars.status,
      ),
    onSuccess: async (_data, vars) => {
      toast.success(
        vars.status === "taken" ? "Medicine marked taken" : "Medicine skipped",
      );
      await invalidateCareGraph(qc);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const appointmentAction = useMutation({
    mutationFn: (vars: {
      patientUserId: string;
      appointmentId: string;
      action: "reschedule" | "cancel";
    }) =>
      caregiverRepository.requestAppointmentActionForPatient(
        vars.patientUserId,
        vars.appointmentId,
        vars.action,
      ),
    onSuccess: async (_data, vars) => {
      toast.success(
        vars.action === "reschedule"
          ? "Reschedule requested"
          : "Cancellation requested",
      );
      await invalidateCareGraph(qc);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const savePrefs = useMutation({
    mutationFn: async (prefs: {
      medicine: boolean;
      appointment: boolean;
      tips: boolean;
      doctor_messages: boolean;
    }) => caregiverRepository.updateNotificationPrefs(userId, prefs),
    onSuccess: async () => {
      toast.success("Preferences saved");
      await qc.invalidateQueries({ queryKey: caregiverKeys.prefs(userId) });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return { markMedicine, appointmentAction, savePrefs };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import { getStore, IDS, subscribeStore } from "@/data/store";
import { invalidateCareGraph } from "@/lib/care-graph";

import { investigationRepository } from "./repository";
import type { InvestigationQueueFilter } from "./types";

export const investigationKeys = {
  all: ["investigations"] as const,
  patient: (id: string) => ["investigations", "patient", id] as const,
  doctor: (id: string, filter: string) =>
    ["investigations", "doctor", id, filter] as const,
  stats: (id: string) => ["investigations", "stats", id] as const,
};

export function useInvalidateInvestigationsOnStore() {
  const qc = useQueryClient();
  useEffect(() => {
    return subscribeStore(() => {
      void qc.invalidateQueries({ queryKey: investigationKeys.all });
    });
  }, [qc]);
}

export function usePatientInvestigations(patientId?: string) {
  useInvalidateInvestigationsOnStore();
  useEffect(() => {
    investigationRepository.sendDueReminders();
  }, [patientId]);
  return useQuery({
    queryKey: investigationKeys.patient(patientId || "none"),
    queryFn: () => investigationRepository.listForPatient(patientId!),
    enabled: Boolean(patientId),
  });
}

export function useDoctorInvestigations(filter: InvestigationQueueFilter = "all") {
  const { user } = useAuth();
  const doctorId =
    getStoreDoctorId(user?.id) || IDS.doctor;
  useInvalidateInvestigationsOnStore();
  useEffect(() => {
    investigationRepository.sendDueReminders();
  }, []);
  return useQuery({
    queryKey: investigationKeys.doctor(doctorId, filter),
    queryFn: () => investigationRepository.listForDoctor(doctorId, filter),
    enabled: Boolean(doctorId),
  });
}

export function useInvestigationStats() {
  const { user } = useAuth();
  const doctorId = getStoreDoctorId(user?.id) || IDS.doctor;
  useInvalidateInvestigationsOnStore();
  return useQuery({
    queryKey: investigationKeys.stats(doctorId),
    queryFn: () => investigationRepository.complianceStats(doctorId),
  });
}

function getStoreDoctorId(userId?: string | null) {
  if (!userId) return null;
  return getStore().doctors.find((d) => d.user_id === userId)?.id ?? null;
}

export function useInvestigationMutations() {
  const qc = useQueryClient();

  const markCompleted = useMutation({
    mutationFn: (id: string) => investigationRepository.markCompleted(id),
    onSuccess: async () => {
      toast.success("Marked complete — doctor will review");
      await invalidateCareGraph(qc);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadReport = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      investigationRepository.uploadReport(id, file),
    onSuccess: async () => {
      toast.success("Report uploaded for doctor review");
      await invalidateCareGraph(qc);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const review = useMutation({
    mutationFn: async ({
      id,
      doctorUserId,
      decision,
    }: {
      id: string;
      doctorUserId: string;
      decision?: "completed" | "cancelled";
    }) =>
      investigationRepository.review(id, doctorUserId, decision ?? "completed"),
    onSuccess: async () => {
      toast.success("Investigation reviewed");
      await invalidateCareGraph(qc);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { markCompleted, uploadReport, review };
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "@/contexts/auth-context";
import { subscribeStore } from "@/data/store";
import { invalidateCareGraph } from "@/lib/care-graph";
import { identityRepository } from "@/modules/identity/repository";
import type {
  PmjayEligibilityResult,
  PmjayWizardAnswers,
} from "@/modules/identity/types";

const keys = {
  passport: (id: string) => ["identity", "passport", id] as const,
  timeline: (id: string) => ["identity", "timeline", id] as const,
  records: (id: string) => ["identity", "records", id] as const,
  benefits: (id: string) => ["identity", "benefits", id] as const,
  emergency: (token: string) => ["identity", "emergency", token] as const,
};

function useInvalidateIdentityOnStore() {
  const qc = useQueryClient();
  useEffect(() => {
    return subscribeStore(() => {
      void qc.invalidateQueries({ queryKey: ["identity"] });
    });
  }, [qc]);
}

export function useDigitalPassport(patientOrUserId?: string | null) {
  const { user } = useAuth();
  const id = patientOrUserId ?? user?.id;
  useInvalidateIdentityOnStore();
  return useQuery({
    queryKey: keys.passport(id || "none"),
    queryFn: () => identityRepository.getDigitalPassport(id!),
    enabled: Boolean(id),
  });
}

export function useMedicalTimeline(patientOrUserId?: string | null) {
  const { user } = useAuth();
  const id = patientOrUserId ?? user?.id;
  useInvalidateIdentityOnStore();
  return useQuery({
    queryKey: keys.timeline(id || "none"),
    queryFn: () => identityRepository.getTimeline(id!),
    enabled: Boolean(id),
  });
}

export function useHealthRecords(patientOrUserId?: string | null) {
  const { user } = useAuth();
  const id = patientOrUserId ?? user?.id;
  useInvalidateIdentityOnStore();
  return useQuery({
    queryKey: keys.records(id || "none"),
    queryFn: () => identityRepository.listHealthRecords(id!),
    enabled: Boolean(id),
  });
}

export function useBenefitsDashboard(patientOrUserId?: string | null) {
  const { user } = useAuth();
  const id = patientOrUserId ?? user?.id;
  useInvalidateIdentityOnStore();
  return useQuery({
    queryKey: keys.benefits(id || "none"),
    queryFn: () => identityRepository.getBenefitsDashboard(id!),
    enabled: Boolean(id),
  });
}

export function useEmergencyProfile(token: string | undefined) {
  return useQuery({
    queryKey: keys.emergency(token || "none"),
    queryFn: () => identityRepository.getEmergencyProfile(token!),
    enabled: Boolean(token),
  });
}

export function useIdentityMutations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const id = user?.id;

  const invalidate = async () => {
    await invalidateCareGraph(qc);
  };

  const importAbha = useMutation({
    mutationFn: (abhaId: string) =>
      identityRepository.importAbhaRecords(id!, abhaId),
    onSuccess: invalidate,
  });

  const savePmjay = useMutation<PmjayEligibilityResult, Error, PmjayWizardAnswers>({
    mutationFn: async (answers) =>
      identityRepository.savePmjayAssessment(id!, answers),
    onSuccess: invalidate,
  });

  return { importAbha, savePmjay };
}

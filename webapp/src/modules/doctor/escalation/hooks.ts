import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import { invalidateCareGraph } from "@/lib/care-graph";
import { getStore, IDS } from "@/data/store";
import { escalationRepository } from "@/modules/doctor/escalation/repository";
import type { ReferralPayload } from "@/modules/doctor/escalation/types";

function actorId(token: string | null): string {
  if (!token) return IDS.doctorUser;
  if (token === "demo-token-doctor") return IDS.doctorUser;
  if (token.length === 36) return token;
  return IDS.doctorUser;
}

export function useEscalationBundle() {
  const { accessToken } = useAuth();
  const userId = actorId(accessToken);
  return useQuery({
    queryKey: ["doctor", "escalation", "bundle"],
    queryFn: () => escalationRepository.getBundle(userId),
    enabled: Boolean(accessToken || true),
  });
}

export function usePatientRiskData(patientId?: string | null) {
  const { accessToken } = useAuth();
  const userId = actorId(accessToken);
  return useQuery({
    queryKey: ["doctor", "escalation", "risk", patientId],
    queryFn: () => escalationRepository.getRiskData(userId, patientId!),
    enabled: Boolean(patientId),
  });
}

export function useEscalationActions() {
  const { accessToken } = useAuth();
  const userId = actorId(accessToken);
  const qc = useQueryClient();

  const orderInvestigation = useMutation({
    mutationFn: ({
      patientId,
      name,
    }: {
      patientId: string;
      name: string;
    }) => {
      escalationRepository.orderInvestigation(userId, patientId, name);
      return Promise.resolve(getStore());
    },
    onSuccess: async (_d, vars) => {
      toast.success(`${vars.name} ordered`);
      await invalidateCareGraph(qc, { patientId: vars.patientId });
      await qc.invalidateQueries({ queryKey: ["doctor", "escalation"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submitReferral = useMutation({
    mutationFn: (payload: ReferralPayload) => {
      escalationRepository.submitReferral(userId, payload);
      return Promise.resolve(payload);
    },
    onSuccess: async (payload) => {
      toast.success("Referral submitted");
      await invalidateCareGraph(qc, { patientId: payload.patient_id });
      await qc.invalidateQueries({ queryKey: ["doctor", "escalation"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { orderInvestigation, submitReferral };
}

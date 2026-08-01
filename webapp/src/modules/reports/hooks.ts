import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import { IDS } from "@/data/store";
import { reportsRepository } from "@/modules/reports/repository";

function actorId(token: string | null, fallback: string) {
  if (!token) return fallback;
  if (token.startsWith("demo-token-")) return fallback;
  if (token.length === 36) return token;
  return fallback;
}

export function usePatientReports() {
  const { accessToken, user } = useAuth();
  const userId = actorId(accessToken, user?.id || IDS.patientUser);
  return useQuery({
    queryKey: ["reports", "patient", userId],
    queryFn: () => reportsRepository.listForPatient(userId),
    enabled: Boolean(user),
  });
}

export function useDoctorReports() {
  const { accessToken, user } = useAuth();
  const userId = actorId(accessToken, user?.id || IDS.doctorUser);
  return useQuery({
    queryKey: ["reports", "doctor", userId],
    queryFn: () => reportsRepository.listForDoctor(userId),
    enabled: Boolean(user),
  });
}

export function useReportMutations() {
  const { accessToken, user } = useAuth();
  const qc = useQueryClient();
  const userId = actorId(
    accessToken,
    user?.id || (user?.role === "doctor" ? IDS.doctorUser : IDS.patientUser),
  );

  const upload = useMutation({
    mutationFn: (input: {
      title: string;
      report_type: string;
      notes?: string;
      file?: File | null;
      doctorId?: string | null;
    }) => reportsRepository.upload(userId, input),
    onSuccess: async () => {
      toast.success("Report uploaded to selected doctor");
      await qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const feedback = useMutation({
    mutationFn: ({
      reportId,
      text,
    }: {
      reportId: string;
      text: string;
    }) => Promise.resolve(reportsRepository.feedback(userId, reportId, text)),
    onSuccess: async () => {
      toast.success("Feedback sent to patient");
      await qc.invalidateQueries({ queryKey: ["reports"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { upload, feedback };
}

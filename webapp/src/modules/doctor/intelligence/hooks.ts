import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { getSupabaseClient } from "@/lib/supabase";
import { intelligenceRepository } from "@/modules/doctor/intelligence/repository";
import type { IntelligenceFilters } from "@/modules/doctor/intelligence/types";
import { countPendingSync } from "@/modules/rural/offline/storage";

const emptyFilters: IntelligenceFilters = {
  search: "",
  risk: "",
  disease: "",
  age: "",
  recovery: "",
  appointment: "",
  health_worker: "",
  caregiver: "",
};

export function useIntelligenceFilters() {
  const [filters, setFilters] = useState<IntelligenceFilters>(emptyFilters);
  return { filters, setFilters, reset: () => setFilters(emptyFilters) };
}

export function useDoctorIntelligence(filters: IntelligenceFilters) {
  const { user, accessToken } = useAuth();
  const userId = user?.id || accessToken || "";

  return useQuery({
    queryKey: ["doctor", "intelligence", userId, filters],
    queryFn: () => intelligenceRepository.getBundle(userId, filters),
    enabled: Boolean(userId),
    refetchInterval: 20_000,
  });
}

export function useAiPatientSummary(patientId?: string) {
  return useQuery({
    queryKey: ["doctor", "ai-summary-intel", patientId],
    queryFn: async () => {
      const base = intelligenceRepository.getAiPatientSummary(patientId!);
      const { summarizePatientRoutineAsync } = await import(
        "@/modules/ai-support/routine-summary"
      );
      const routine = await summarizePatientRoutineAsync(patientId!);
      return {
        ...base,
        narrative: routine.paragraphs[0] || base.narrative,
        latest_symptoms:
          base.latest_symptoms.length > 0
            ? base.latest_symptoms
            : routine.bullets
                .find((b) => b.startsWith("Reported symptoms"))
                ?.replace("Reported symptoms: ", "")
                .split(", ")
                .filter(Boolean) || [],
        disclaimer: `${base.disclaimer} · ${routine.provider}`,
      };
    },
    enabled: Boolean(patientId),
    staleTime: 15_000,
  });
}

/** Live doctor routine summary — local engine + OpenRouter when configured. */
export function useDoctorRoutineSummary(patientId?: string) {
  return useQuery({
    queryKey: ["doctor", "routine-summary", patientId],
    queryFn: async () => {
      const { summarizePatientRoutineAsync } = await import(
        "@/modules/ai-support/routine-summary"
      );
      return summarizePatientRoutineAsync(patientId!);
    },
    enabled: Boolean(patientId),
    staleTime: 10_000,
  });
}

/** Local store + optional Supabase Realtime → keep Intelligence Center fresh. */
export function useDoctorRealtimeInvalidation() {
  const qc = useQueryClient();

  useEffect(() => {
    const unsub = intelligenceRepository.subscribe(() => {
      void qc.invalidateQueries({ queryKey: ["doctor"] });
      void qc.invalidateQueries({ queryKey: ["patients"] });
    });
    return unsub;
  }, [qc]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel("doctor-intelligence")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "health_checkins" },
        () => {
          void qc.invalidateQueries({ queryKey: ["doctor"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {
          void qc.invalidateQueries({ queryKey: ["doctor"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => {
          void qc.invalidateQueries({ queryKey: ["doctor"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recovery_scores" },
        () => {
          void qc.invalidateQueries({ queryKey: ["doctor"] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => {
          void qc.invalidateQueries({ queryKey: ["doctor"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}

export function useOfflineSyncPendingAlert() {
  return useQuery({
    queryKey: ["doctor", "offline-pending"],
    queryFn: countPendingSync,
    refetchInterval: 15_000,
  });
}

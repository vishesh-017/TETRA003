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
    queryFn: () => intelligenceRepository.getAiPatientSummary(patientId!),
    enabled: Boolean(patientId),
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

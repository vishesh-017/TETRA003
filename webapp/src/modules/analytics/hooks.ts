import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { getSupabaseClient } from "@/lib/supabase";
import { analyticsRepository } from "@/modules/analytics/repository";
import type { AnalyticsFilters, ReportKind } from "@/modules/analytics/types";

const emptyFilters: AnalyticsFilters = {
  age: "",
  disease: "",
  doctor: "",
  risk: "",
};

export function useAnalyticsFilters() {
  const [filters, setFilters] = useState<AnalyticsFilters>(emptyFilters);
  return {
    filters,
    setFilters,
    reset: () => setFilters(emptyFilters),
  };
}

export function useExecutiveAnalytics(filters: AnalyticsFilters) {
  const { user, accessToken } = useAuth();
  const userId = user?.id || accessToken || "";

  return useQuery({
    queryKey: ["analytics", "executive", userId, filters],
    queryFn: () => analyticsRepository.getBundle(userId, filters),
    enabled: Boolean(userId),
    staleTime: 15_000,
  });
}

export function useAnalyticsReport(kind: ReportKind, patientId?: string) {
  const { user, accessToken } = useAuth();
  const userId = user?.id || accessToken || "";

  return useQuery({
    queryKey: ["analytics", "report", userId, kind, patientId],
    queryFn: () => analyticsRepository.buildReport(userId, kind, patientId),
    enabled: Boolean(userId),
  });
}

export function useAnalyticsRealtimeInvalidation() {
  const qc = useQueryClient();

  useEffect(() => {
    const unsub = analyticsRepository.subscribe(() => {
      void qc.invalidateQueries({ queryKey: ["analytics"] });
      void qc.invalidateQueries({ queryKey: ["doctor"] });
    });
    return unsub;
  }, [qc]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const channel = supabase
      .channel("executive-analytics")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkins" },
        () => void qc.invalidateQueries({ queryKey: ["analytics"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => void qc.invalidateQueries({ queryKey: ["analytics"] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "medicine_events" },
        () => void qc.invalidateQueries({ queryKey: ["analytics"] }),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}

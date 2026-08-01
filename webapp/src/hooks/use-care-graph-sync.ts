import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useAuth } from "@/contexts/auth-context";
import { subscribeStore } from "@/data/store";
import { invalidateCareGraph } from "@/lib/care-graph";
import { getSupabaseClient } from "@/lib/supabase";

/**
 * Keep every role dashboard in sync with the shared local store and
 * optional Supabase Realtime tables that drive care workflows.
 */
export function useCareGraphSync() {
  const qc = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    return subscribeStore(() => {
      void invalidateCareGraph(qc);
    });
  }, [qc]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return;

    const channel = supabase
      .channel(`care-graph-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => void invalidateCareGraph(qc),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => void invalidateCareGraph(qc),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recovery_scores" },
        () => void invalidateCareGraph(qc),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkins" },
        () => void invalidateCareGraph(qc),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "medicine_events" },
        () => void invalidateCareGraph(qc),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "investigations" },
        () => void invalidateCareGraph(qc),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => void invalidateCareGraph(qc),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc, user]);
}

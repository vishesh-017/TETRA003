import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useAuth } from "@/contexts/auth-context";
import { subscribeStore } from "@/data/store";
import { invalidateCareGraph } from "@/lib/care-graph";
import { getSupabaseClient } from "@/lib/supabase";

/**
 * Keep every role dashboard in sync with the shared local store and
 * optional Supabase Realtime tables that drive care workflows.
 * Debounced so rapid store writes cannot freeze the UI.
 */
export function useCareGraphSync() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void invalidateCareGraph(qc);
      }, 80);
    };

    const unsub = subscribeStore(schedule);
    return () => {
      unsub();
      if (timer.current) clearTimeout(timer.current);
    };
  }, [qc]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !user) return;

    const bump = () => void invalidateCareGraph(qc);

    const channel = supabase
      .channel(`care-graph-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        bump,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        bump,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "recovery_scores" },
        bump,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checkins" },
        bump,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "medicine_events" },
        bump,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "investigations" },
        bump,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        bump,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc, user]);
}

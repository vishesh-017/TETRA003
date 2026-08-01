import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useAuth } from "@/contexts/auth-context";
import { invalidateCareGraph } from "@/lib/care-graph";
import {
  countPendingSync,
  listNotifications,
  listScreenings,
  saveScreening,
} from "@/modules/rural/offline/storage";
import { isOnline, runRuralSync } from "@/modules/rural/offline/sync-engine";
import { ruralRepository } from "@/modules/rural/repository";
import { getEducationCards } from "@/modules/rural/services/education.service";
import { useRuralLocale } from "@/modules/rural/i18n/locale-context";
import type { RuralScreeningInput } from "@/modules/rural/types";

const keys = {
  dash: (id: string) => ["rural", "dashboard", id] as const,
  patients: (id: string) => ["rural", "patients", id] as const,
  visits: (id: string) => ["rural", "visits", id] as const,
  screenings: ["rural", "screenings"] as const,
  notifications: ["rural", "notifications"] as const,
  pending: ["rural", "pending"] as const,
};

export function useOnlineStatus() {
  const [online, setOnline] = useState(isOnline());
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Auto background sync when connectivity returns
  useEffect(() => {
    if (!online) return;
    void runRuralSync();
  }, [online]);

  return online;
}

export function useRuralDashboard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.dash(user?.id || "none"),
    queryFn: () => ruralRepository.getDashboard(user!.id),
    enabled: Boolean(user),
    refetchInterval: 15_000,
  });
}

export function useAssignedPatients() {
  const { user } = useAuth();
  return useQuery({
    queryKey: keys.patients(user?.id || "none"),
    queryFn: () => ruralRepository.listAssignedPatients(user!.id),
    enabled: Boolean(user),
  });
}

export function useHomeVisits() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: keys.visits(user?.id || "none"),
    queryFn: () => ruralRepository.listVisits(user!.id),
    enabled: Boolean(user),
  });
  const complete = useMutation({
    mutationFn: (visitId: string) =>
      Promise.resolve(ruralRepository.completeVisit(visitId)),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.visits(user?.id || "none") }),
  });
  return { ...list, complete };
}

export function useRuralScreenings() {
  return useQuery({
    queryKey: keys.screenings,
    queryFn: listScreenings,
  });
}

export function useSaveScreening() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RuralScreeningInput) => {
      const hwId = ruralRepository.resolveHealthWorkerId(user!.id);
      const saved = await saveScreening(hwId, input);
      if (isOnline()) await runRuralSync();
      return saved;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: keys.screenings }),
        qc.invalidateQueries({ queryKey: keys.pending }),
        qc.invalidateQueries({ queryKey: keys.notifications }),
        qc.invalidateQueries({ queryKey: ["rural", "dashboard"] }),
        invalidateCareGraph(qc),
      ]);
    },
  });
}

export function useRuralSync() {
  const qc = useQueryClient();
  const pending = useQuery({
    queryKey: keys.pending,
    queryFn: countPendingSync,
    refetchInterval: 10_000,
  });
  const sync = useMutation({
    mutationFn: runRuralSync,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["rural"] }),
        qc.invalidateQueries({ queryKey: ["predict"] }),
        invalidateCareGraph(qc),
      ]);
    },
  });
  return { pending, sync };
}

export function useRuralNotifications() {
  return useQuery({
    queryKey: keys.notifications,
    queryFn: listNotifications,
  });
}

export function useEducationCards() {
  const { locale } = useRuralLocale();
  return getEducationCards(locale);
}

export function useRegisterPatient() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (input: {
      full_name: string;
      phone?: string;
      village?: string;
    }) => Promise.resolve(ruralRepository.registerOfflinePatient(input)),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: keys.patients(user?.id || "none") }),
  });
}

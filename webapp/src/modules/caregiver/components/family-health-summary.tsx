import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  HeartPulse,
  Users,
} from "lucide-react";

import type { FamilyHealthSummary } from "@/modules/caregiver/types";

export function FamilyHealthSummaryCard({
  summary,
}: {
  summary: FamilyHealthSummary;
}) {
  if (summary.memberCount < 2) return null;

  const tiles = [
    {
      label: "Overall wellness",
      value: `${summary.overallWellness}`,
      hint: "Avg recovery",
      icon: HeartPulse,
    },
    {
      label: "Needs attention",
      value: `${summary.attentionCount}`,
      hint: "Patients",
      icon: Users,
    },
    {
      label: "Upcoming visits",
      value: `${summary.upcomingAppointments}`,
      hint: "Appointments",
      icon: CalendarDays,
    },
    {
      label: "Critical alerts",
      value: `${summary.criticalAlerts}`,
      hint: "Open now",
      icon: AlertTriangle,
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Family Health Overview
      </p>
      <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
        All assigned patients
      </h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <div
              key={tile.label}
              className="rounded-2xl border border-border/70 bg-gradient-to-br from-slate-50 to-white px-4 py-3"
            >
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-teal-700" />
                {tile.label}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {tile.value}
              </p>
              <p className="text-[11px] text-muted-foreground">{tile.hint}</p>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

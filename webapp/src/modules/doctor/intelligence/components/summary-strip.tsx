import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardX,
  Siren,
  UserRound,
  Users,
} from "lucide-react";

import type { IntelligenceSummary } from "@/modules/doctor/intelligence/types";
import { cn } from "@/lib/utils";

const CARDS: Array<{
  key: keyof IntelligenceSummary;
  label: string;
  icon: typeof Users;
  accent: string;
  filterHint?: string;
}> = [
  {
    key: "total_patients",
    label: "Total Patients",
    icon: Users,
    accent: "from-primary/15 to-transparent",
  },
  {
    key: "active_followups",
    label: "Active Follow-ups",
    icon: UserRound,
    accent: "from-secondary/15 to-transparent",
    filterHint: "followups",
  },
  {
    key: "high_risk_patients",
    label: "High Risk",
    icon: AlertTriangle,
    accent: "from-warning/20 to-transparent",
    filterHint: "high_risk",
  },
  {
    key: "missed_checkins",
    label: "Missed Check-ins",
    icon: ClipboardX,
    accent: "from-orange-500/15 to-transparent",
    filterHint: "missed_checkins",
  },
  {
    key: "appointments_today",
    label: "Appointments Today",
    icon: CalendarDays,
    accent: "from-sky-500/15 to-transparent",
    filterHint: "appointments",
  },
  {
    key: "emergency_alerts",
    label: "Emergency Alerts",
    icon: Siren,
    accent: "from-destructive/20 to-transparent",
    filterHint: "emergency",
  },
];

export function SummaryStrip({
  summary,
  onSelect,
  active,
}: {
  summary: IntelligenceSummary;
  onSelect?: (hint: string) => void;
  active?: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {CARDS.map((card, i) => {
        const Icon = card.icon;
        const selected = active === card.filterHint;
        return (
          <motion.button
            key={card.key}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() =>
              card.filterHint && onSelect?.(card.filterHint)
            }
            className={cn(
              "rounded-3xl border border-border/80 bg-gradient-to-br p-4 text-left shadow-soft transition hover:-translate-y-0.5",
              card.accent,
              selected && "ring-2 ring-primary",
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {card.label}
              </p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-3 font-display text-3xl font-semibold tabular-nums">
              {summary[card.key]}
            </p>
          </motion.button>
        );
      })}
    </div>
  );
}

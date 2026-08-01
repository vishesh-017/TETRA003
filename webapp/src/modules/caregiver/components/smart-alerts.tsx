import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { alertTone } from "@/modules/caregiver/lib";
import type { SmartAlert } from "@/modules/caregiver/types";

const priorityLabel = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
} as const;

export function SmartAlerts({
  alerts,
  title = "Smart Alerts",
}: {
  alerts: SmartAlert[];
  title?: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Priority
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">{title}</h2>
      </div>

      <ul className="space-y-3">
        {alerts.map((alert, i) => (
          <motion.li
            key={alert.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={cn(
              "rounded-2xl border px-4 py-3",
              alertTone(alert.priority),
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                {priorityLabel[alert.priority]}
              </span>
              <span className="text-xs opacity-70">{alert.timeAgo}</span>
            </div>
            <p className="mt-2 text-sm font-semibold">{alert.title}</p>
            <p className="mt-1 text-sm opacity-80">{alert.detail}</p>
            {alert.actionLabel ? (
              <Button
                size="sm"
                variant="secondary"
                className="mt-3"
                onClick={() =>
                  toast.success(`${alert.actionLabel} noted`, {
                    description: "We'll keep this in today's care focus.",
                  })
                }
              >
                {alert.actionLabel}
              </Button>
            ) : null}
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

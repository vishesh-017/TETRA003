import { motion } from "framer-motion";
import { AlertTriangle, Bell, Siren } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { AlertDecisionResult } from "@/lib/health-engine";
import { cn } from "@/lib/utils";

const TONE: Record<
  AlertDecisionResult["action"],
  { icon: typeof Bell; className: string }
> = {
  no_action: {
    icon: Bell,
    className: "border-border bg-card text-foreground",
  },
  monitor: {
    icon: Bell,
    className: "border-primary/30 bg-primary/10 text-foreground",
  },
  doctor_review: {
    icon: AlertTriangle,
    className: "border-warning/40 bg-warning/15 text-foreground",
  },
  immediate_attention: {
    icon: AlertTriangle,
    className: "border-destructive/40 bg-destructive/10 text-foreground",
  },
  emergency: {
    icon: Siren,
    className: "border-destructive bg-destructive/15 text-foreground",
  },
};

export function AlertBanner({
  alert,
  className,
}: {
  alert: AlertDecisionResult;
  className?: string;
}) {
  if (alert.action === "no_action") return null;
  const tone = TONE[alert.action];
  const Icon = tone.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={
        alert.action === "emergency" || alert.action === "immediate_attention"
          ? { opacity: 1, y: 0, scale: [1, 1.01, 1] }
          : { opacity: 1, y: 0 }
      }
      transition={
        alert.action === "emergency" || alert.action === "immediate_attention"
          ? { scale: { duration: 1.5, repeat: Infinity } }
          : undefined
      }
      className={cn(
        "flex flex-col gap-2 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        tone.className,
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{alert.title}</p>
            <Badge variant="outline" className="capitalize">
              {alert.action.replaceAll("_", " ")}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {alert.patient_message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

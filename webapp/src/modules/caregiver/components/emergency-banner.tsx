import { motion } from "framer-motion";
import { Siren } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCaregiver } from "@/modules/caregiver/context";

export function CaregiverEmergencyBanner() {
  const { alerts, selected, allAlerts } = useCaregiver();
  const critical =
    alerts.find((a) => a.priority === "critical" || a.priority === "high") ||
    allAlerts.find((a) => a.priority === "critical");

  if (!critical) return null;

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-[1.75rem] border border-rose-300 bg-gradient-to-r from-rose-600 to-orange-500 p-5 text-white shadow-lift"
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-white/10"
        animate={{ opacity: [0.15, 0.35, 0.15] }}
        transition={{ duration: 1.6, repeat: Infinity }}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
            <Siren className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/80">
              {critical.priority} alert · {selected.name.split(" ")[0]}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
              {critical.title}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-white/90">{critical.detail}</p>
            <p className="mt-2 text-xs text-white/70">{critical.timeAgo}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/caregiver/emergency"
            className={cn(
              buttonVariants({ size: "sm" }),
              "border-0 bg-white text-rose-700 hover:bg-white/90",
            )}
          >
            Emergency center
          </Link>
          <Link
            to="/caregiver/alerts"
            className={cn(
              buttonVariants({ size: "sm", variant: "secondary" }),
              "border-0 bg-white/15 text-white hover:bg-white/25",
            )}
          >
            View alerts
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

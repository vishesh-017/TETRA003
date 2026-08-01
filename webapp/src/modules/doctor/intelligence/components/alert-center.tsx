import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { BellOff } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { IntelligenceAlert } from "@/modules/doctor/intelligence/types";
import { cn } from "@/lib/utils";

export function AlertCenter({
  alerts,
  offlinePending,
}: {
  alerts: IntelligenceAlert[];
  offlinePending?: number;
}) {
  const rows = [...alerts];
  if (offlinePending && offlinePending > 0) {
    rows.unshift({
      id: "offline-sync",
      category: "offline_sync",
      severity: "moderate",
      title: "Offline sync pending",
      body: `${offlinePending} rural field records waiting to sync`,
      patient_id: null,
      patient_name: null,
      created_at: new Date().toISOString(),
      action_label: "Open rural sync",
      action_href: "/rural/sync",
    });
  }

  return (
    <section className="rounded-3xl border border-border/80 bg-card/70 p-5 shadow-soft backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-semibold">Alert Center</h2>
        <Badge variant="outline">{rows.length}</Badge>
      </div>
      <div className="mt-4 max-h-[420px] space-y-2 overflow-auto pr-1">
        {rows.length ? (
          rows.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={cn(
                "rounded-2xl border p-3",
                alert.category === "emergency"
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-border/70 bg-background/50",
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{alert.title}</p>
                <Badge variant="outline" className="capitalize">
                  {alert.severity}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {alert.patient_name || "System"} ·{" "}
                {formatDistanceToNow(new Date(alert.created_at), {
                  addSuffix: true,
                })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{alert.body}</p>
              <Link
                to={alert.action_href}
                className={cn(
                  buttonVariants({ size: "sm", variant: "outline" }),
                  "mt-2",
                )}
              >
                {alert.action_label}
              </Link>
            </motion.div>
          ))
        ) : (
          <EmptyState
            icon={BellOff}
            className="border-0 bg-transparent py-8 shadow-none"
            title="No pending alerts"
            description="You're caught up. New escalations will appear here instantly."
          />
        )}
      </div>
    </section>
  );
}

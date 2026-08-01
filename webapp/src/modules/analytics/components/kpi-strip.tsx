import { motion } from "framer-motion";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

import type { KpiMetric } from "@/modules/analytics/types";
import { cn } from "@/lib/utils";

function formatValue(kpi: KpiMetric): string {
  if (kpi.unit === "percent") return `${kpi.value.toFixed(kpi.value % 1 ? 1 : 0)}%`;
  if (kpi.unit === "score") return kpi.value.toFixed(kpi.value % 1 ? 1 : 0);
  return String(Math.round(kpi.value));
}

export function KpiStrip({ kpis }: { kpis: KpiMetric[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {kpis.map((kpi, i) => {
        const invert =
          kpi.id === "avg_readmission" || kpi.id === "attention";
        const improving =
          kpi.trend === "flat"
            ? null
            : invert
              ? kpi.trend === "down"
              : kpi.trend === "up";

        return (
          <motion.article
            key={kpi.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.28) }}
            title={kpi.question}
            className="rounded-3xl border border-border/80 bg-card/80 p-4 shadow-soft backdrop-blur"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
              {formatValue(kpi)}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-xs">
              {kpi.trend === "up" ? (
                <TrendingUp
                  className={cn(
                    "h-3.5 w-3.5",
                    improving ? "text-emerald-600" : "text-destructive",
                  )}
                />
              ) : kpi.trend === "down" ? (
                <TrendingDown
                  className={cn(
                    "h-3.5 w-3.5",
                    improving ? "text-emerald-600" : "text-destructive",
                  )}
                />
              ) : (
                <Minus className="h-3.5 w-3.5 text-muted-foreground" />
              )}
              <span
                className={cn(
                  "font-medium",
                  improving === null
                    ? "text-muted-foreground"
                    : improving
                      ? "text-emerald-700"
                      : "text-destructive",
                )}
              >
                {kpi.delta >= 0 ? "+" : ""}
                {kpi.delta}
                {kpi.unit === "percent" || kpi.unit === "score" ? "" : ""}{" "}
                <span className="font-normal text-muted-foreground">
                  vs last week
                </span>
              </span>
            </div>
          </motion.article>
        );
      })}
    </section>
  );
}

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { HealthInsight } from "@/modules/caregiver/types";

const toneClass = {
  positive: "from-emerald-50 to-teal-50/40 border-emerald-100",
  neutral: "from-sky-50 to-white border-sky-100",
  attention: "from-amber-50 to-orange-50/50 border-amber-100",
} as const;

export function InsightCards({ insights }: { insights: HealthInsight[] }) {
  return (
    <section>
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Health Insights
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          What matters — and why
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((insight, i) => (
          <motion.article
            key={insight.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              "rounded-2xl border bg-gradient-to-br p-4 shadow-soft",
              toneClass[insight.tone],
            )}
          >
            <h3 className="text-sm font-semibold text-foreground">{insight.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground/80">Why: </span>
              {insight.why}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

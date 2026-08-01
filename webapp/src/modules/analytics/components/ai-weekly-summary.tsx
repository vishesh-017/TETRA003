import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import type { AiWeeklySummary } from "@/modules/analytics/types";

export function AiWeeklySummaryPanel({
  summary,
}: {
  summary: AiWeeklySummary;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl border border-border/80 bg-gradient-to-br from-primary/10 via-card/80 to-secondary/10 p-5 shadow-soft backdrop-blur"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            AI Weekly Summary
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            {summary.headline}
          </h2>
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-sm text-foreground/90">
        {summary.bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl border border-border/70 bg-background/50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Recommended focus
        </p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {summary.recommendations.map((r) => (
            <li key={r}>· {r}</li>
          ))}
        </ul>
      </div>

      <div className="mt-4">
        <AiDisclaimer />
      </div>
    </motion.section>
  );
}

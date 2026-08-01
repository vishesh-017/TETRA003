import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import type { AiCareInsight } from "@/modules/caregiver/types";

export function AiCareInsights({ insight }: { insight: AiCareInsight }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[1.75rem] border border-teal-100 bg-gradient-to-br from-teal-50/80 via-white to-sky-50/60 p-5 shadow-soft"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-600 text-white">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-800/70">
            AI Care Insights
          </p>
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Gentle guidance for today
          </h2>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-foreground">{insight.summary}</p>
      <ul className="mt-3 space-y-2">
        {insight.bullets.map((b) => (
          <li
            key={b}
            className="rounded-xl bg-white/80 px-3 py-2 text-sm text-muted-foreground ring-1 ring-teal-100/80"
          >
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-4">
        <AiDisclaimer />
      </div>
    </motion.section>
  );
}

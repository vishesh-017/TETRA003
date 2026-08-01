import { motion } from "framer-motion";

import { AiCareInsights } from "@/modules/caregiver/components/ai-insights";
import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { HealthRing } from "@/modules/caregiver/components/health-ring";
import { InsightCards } from "@/modules/caregiver/components/insight-cards";
import { useCaregiver } from "@/modules/caregiver/context";
import { useHealthIntelligence } from "@/hooks/health-engine";

export function CaregiverTrendsPage() {
  const { selected, insights, aiInsight, trendSeries } = useCaregiver();
  const intel = useHealthIntelligence(selected.userId);

  const week =
    trendSeries.length > 0
      ? trendSeries
      : [{ day: "Now", score: selected.recoveryScore }];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Health Trends
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Recovery story from live check-ins
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Risk {selected.riskLevel} · Progression {selected.progression} ·{" "}
          {intel?.trends.narrative_summary || selected.trendLabel}
        </p>
      </motion.div>
      <FamilySwitcher />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <HealthRing member={selected} />
        <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Recovery score</h2>
          <div className="mt-6 flex h-44 items-end gap-3">
            {week.map((d, i) => (
              <div key={`${d.day}-${i}`} className="flex flex-1 flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(18, d.score)}%` }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 90 }}
                  className="w-full rounded-t-xl bg-gradient-to-t from-sky-500 to-teal-400"
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {d.day}
                </span>
              </div>
            ))}
          </div>
          {intel?.trends.trends?.length ? (
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {intel.trends.trends.slice(0, 4).map((t) => (
                <li key={t.metric}>
                  <span className="font-medium text-foreground">{t.label}</span>
                  {" — "}
                  {t.natural_language}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>

      <InsightCards insights={insights} />
      <AiCareInsights insight={aiInsight} />
    </div>
  );
}

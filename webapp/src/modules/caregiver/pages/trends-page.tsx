import { motion } from "framer-motion";
import { Activity, Droplets, HeartPulse, TrendingUp } from "lucide-react";

import { AiCareInsights } from "@/modules/caregiver/components/ai-insights";
import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { HealthRing } from "@/modules/caregiver/components/health-ring";
import { InsightCards } from "@/modules/caregiver/components/insight-cards";
import { useCaregiver } from "@/modules/caregiver/context";
import { useHealthIntelligence } from "@/hooks/health-engine";
import { getStore } from "@/data/store";

export function CaregiverTrendsPage() {
  const { selected, insights, aiInsight, trendSeries } = useCaregiver();
  const intel = useHealthIntelligence(selected.userId);

  const week =
    trendSeries.length > 0
      ? trendSeries
      : [{ day: "Now", score: selected.recoveryScore }];

  const maxScore = Math.max(...week.map((d) => d.score), 1);
  const checkins = getStore()
    .checkins.filter((c) => c.patient_id === selected.id)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    .slice(0, 5);

  const latest = checkins[0];
  const sugarVals = week
    .map((d) => ("sugar" in d ? (d as { sugar?: number | null }).sugar : null))
    .filter((v): v is number => v != null);
  const bpVals = week
    .map((d) => ("bp" in d ? (d as { bp?: number | null }).bp : null))
    .filter((v): v is number => v != null);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0B3B5A] via-[#125A7A] to-[#0F766E] p-6 text-white shadow-lift"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          Health Trends
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {selected.name}&apos;s live recovery story
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-teal-50/90">
          Risk {selected.riskLevel} · Progression {selected.progression} ·{" "}
          {intel?.trends.narrative_summary || selected.trendLabel}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip
            icon={HeartPulse}
            label={`Recovery ${selected.recoveryScore}`}
          />
          <Chip
            icon={Droplets}
            label={
              sugarVals.length
                ? `Sugar ${sugarVals[sugarVals.length - 1]}`
                : "Sugar NA"
            }
          />
          <Chip
            icon={Activity}
            label={
              bpVals.length ? `BP ${bpVals[bpVals.length - 1]}` : "BP NA"
            }
          />
          <Chip
            icon={TrendingUp}
            label={`${checkins.length} recent check-in${checkins.length === 1 ? "" : "s"}`}
          />
        </div>
      </motion.div>

      <FamilySwitcher />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <HealthRing member={selected} />
        <section className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-soft">
          <div className="flex items-end justify-between gap-2">
            <div>
              <h2 className="font-display text-xl font-semibold">
                Recovery score
              </h2>
              <p className="text-xs text-muted-foreground">
                Last {week.length} points from live check-ins
              </p>
            </div>
            <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
              Peak {maxScore}
            </span>
          </div>
          <div className="mt-6 flex h-48 items-end gap-2.5">
            {week.map((d, i) => (
              <div
                key={`${d.day}-${i}`}
                className="flex flex-1 flex-col items-center gap-2"
              >
                <span className="text-[11px] font-semibold tabular-nums text-slate-600">
                  {d.score}
                </span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{
                    height: `${Math.max(12, (d.score / Math.max(maxScore, 100)) * 100)}%`,
                  }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 90 }}
                  className="w-full rounded-t-2xl bg-gradient-to-t from-sky-600 via-teal-400 to-emerald-300 shadow-[0_-8px_20px_-12px_rgba(14,116,144,0.55)]"
                />
                <span className="text-xs font-medium text-muted-foreground">
                  {d.day}
                </span>
              </div>
            ))}
          </div>
          {intel?.trends.trends?.length ? (
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {intel.trends.trends.slice(0, 4).map((t) => (
                <li
                  key={t.metric}
                  className="rounded-2xl bg-slate-50 px-3 py-2.5 text-sm"
                >
                  <span className="font-medium text-foreground">{t.label}</span>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t.natural_language}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>

      <section className="rounded-[1.75rem] border border-white/70 bg-white/90 p-5 shadow-soft">
        <h2 className="font-display text-xl font-semibold">
          Recent check-in timeline
        </h2>
        {!checkins.length ? (
          <p className="mt-3 text-sm text-muted-foreground">
            NA — no check-ins yet for {selected.name}. Trends will fill as
            logs arrive.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {checkins.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-start justify-between gap-2 rounded-2xl border border-border/70 bg-gradient-to-r from-slate-50 to-white px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Date(c.recorded_at).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[
                      c.bp_systolic != null
                        ? `BP ${c.bp_systolic}/${c.bp_diastolic ?? "—"}`
                        : null,
                      c.blood_sugar != null ? `Sugar ${c.blood_sugar}` : null,
                      c.oxygen != null ? `SpO₂ ${c.oxygen}` : null,
                      c.mood ? `Mood ${c.mood}` : null,
                      c.symptoms?.length
                        ? c.symptoms.slice(0, 3).join(", ")
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Logged"}
                  </p>
                </div>
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-800">
                  Live
                </span>
              </li>
            ))}
          </ol>
        )}
        {latest ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Latest reading drives the recovery ring for {selected.name}.
          </p>
        ) : null}
      </section>

      <InsightCards insights={insights} />
      <AiCareInsights insight={aiInsight} />
    </div>
  );
}

function Chip({
  icon: Icon,
  label,
}: {
  icon: typeof HeartPulse;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/25">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

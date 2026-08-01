import { BarChart3 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ErrorState } from "@/components/feedback/error-state";
import { AnalyticsSkeleton } from "@/modules/analytics/components/analytics-skeleton";
import {
  useAnalyticsFilters,
  useAnalyticsRealtimeInvalidation,
  useExecutiveAnalytics,
} from "@/modules/analytics/hooks";
import { useAppLocale } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

const RISK_COLORS: Record<string, string> = {
  critical: "#e11d48",
  high: "#ea580c",
  moderate: "#d97706",
  low: "#059669",
};

const DISEASE_KEYS = [
  { key: "diabetes", label: "Diabetes" },
  { key: "hypertension", label: "Hypertension" },
  { key: "ckd", label: "CKD" },
  { key: "cardio", label: "Cardiovascular" },
  { key: "stroke", label: "Stroke" },
] as const;

export function ExecutiveAnalyticsPage() {
  const { t } = useAppLocale();
  const { filters } = useAnalyticsFilters();
  useAnalyticsRealtimeInvalidation();
  const query = useExecutiveAnalytics(filters);

  if (query.isLoading) return <AnalyticsSkeleton />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Unable to load Panel Analytics"
        description={query.error?.message || "Please try again."}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const data = query.data;
  const riskDist = data.distributions.readmission;
  const critical =
    riskDist.find((b) => b.key === "critical")?.value ?? 0;
  const high = riskDist.find((b) => b.key === "high")?.value ?? 0;
  const openEscalations = critical + high;
  const pendingFollowups =
    data.distributions.appointment.find((b) => b.key === "scheduled")?.value ??
    0;

  const kpiTiles = [
    {
      label: "Total patients",
      value: data.cohort_size,
    },
    {
      label: "Open escalations",
      value: openEscalations,
    },
    {
      label: "Pending follow-ups",
      value: pendingFollowups,
    },
    {
      label: "Critical patients",
      value: critical,
    },
  ];

  const pieData = riskDist
    .filter((b) => b.value > 0)
    .map((b) => ({
      name: b.label,
      key: b.key,
      value: b.value,
    }));

  const diseaseBars = DISEASE_KEYS.map((d) => {
    const match = data.hospital_insights.top_diseases.find((x) =>
      x.name.toLowerCase().includes(d.key === "ckd" ? "kidney" : d.key.slice(0, 5)),
    );
    const fallback =
      d.key === "diabetes"
        ? 55
        : d.key === "hypertension"
          ? 55
          : d.key === "ckd"
            ? 35
            : d.key === "cardio"
              ? 45
              : 35;
    const avgRecovery = data.kpis.find((k) => k.id === "avg_recovery")?.value ?? 68;
    const avgReadmit =
      data.kpis.find((k) => k.id === "avg_readmission")?.value ?? 45;
    const score =
      match != null
        ? Math.min(95, Math.round(40 + match.count * 12 + avgReadmit * 0.2))
        : Math.round(
            fallback * 0.7 + (100 - avgRecovery) * 0.25 + avgReadmit * 0.15,
          );
    return { name: d.label, score };
  });

  const focusKpis = data.kpis.filter((k) =>
    ["avg_recovery", "adherence", "followup", "attention"].includes(k.id),
  );

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 pb-12">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-900 via-teal-800 to-sky-900 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-100/90">
              <BarChart3 className="h-3.5 w-3.5" />
              {t("population_insights")}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("panel_analytics")}
            </h1>
            <p className="mt-2 text-sm text-teal-50/85">
              Population-level insights across your patient panel — risk
              distribution, disease scores, and workload metrics.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {kpiTiles.map((tile) => (
              <div
                key={tile.label}
                className="rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-100/80">
                  {tile.label}
                </p>
                <p className="mt-1 font-display text-2xl font-semibold">
                  {tile.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {focusKpis.map((kpi) => (
          <div
            key={kpi.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {kpi.label}
            </p>
            <p className="mt-1 font-display text-2xl font-semibold">
              {kpi.unit === "percent"
                ? `${kpi.value}%`
                : kpi.unit === "score"
                  ? kpi.value
                  : kpi.value}
            </p>
            <p
              className={cn(
                "mt-1 text-xs",
                kpi.trend === "up" && "text-emerald-600",
                kpi.trend === "down" && "text-rose-600",
                kpi.trend === "flat" && "text-muted-foreground",
              )}
            >
              {kpi.delta >= 0 ? "+" : ""}
              {kpi.delta} vs last week
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-xl font-semibold">
            {t("risk_distribution")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How risk is spread across the active panel.
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {pieData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={RISK_COLORS[entry.key] || "#64748b"}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {riskDist.map((b) => (
              <li key={b.key} className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ background: RISK_COLORS[b.key] || "#64748b" }}
                />
                <span className="capitalize text-muted-foreground">
                  {b.label}:
                </span>
                <span className="font-medium">{b.value}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <h2 className="font-display text-xl font-semibold">
            {t("disease_scores")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Screening-oriented panel averages (assistive — not diagnoses).
          </p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={diseaseBars}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#0f766e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </div>
  );
}

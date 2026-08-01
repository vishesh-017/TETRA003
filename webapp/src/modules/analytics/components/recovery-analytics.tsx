import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Tabs } from "@/components/ui/tabs";
import type {
  RecoveryGranularity,
  TrendPoint,
} from "@/modules/analytics/types";

const TABS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

export function RecoveryAnalytics({
  series,
}: {
  series: {
    daily: TrendPoint[];
    weekly: TrendPoint[];
    monthly: TrendPoint[];
  };
}) {
  const [granularity, setGranularity] =
    useState<RecoveryGranularity>("daily");

  const data = useMemo(
    () => series[granularity],
    [series, granularity],
  );

  return (
    <section className="rounded-3xl border border-border/80 bg-card/70 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">
            Recovery Analytics
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            How are patients recovering over time?
          </p>
        </div>
        <Tabs
          tabs={TABS}
          value={granularity}
          onChange={(id) => setGranularity(id as RecoveryGranularity)}
          className="w-auto"
        />
      </div>

      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="recoveryFill" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} />
            <Tooltip
              formatter={(value) => [
                typeof value === "number" ? value.toFixed(1) : value,
                "Recovery score",
              ]}
            />
            <Area
              type="monotone"
              dataKey="recovery_score"
              stroke="hsl(var(--primary))"
              fill="url(#recoveryFill)"
              strokeWidth={2.5}
              isAnimationActive
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

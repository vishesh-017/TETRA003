import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "@/components/charts/chart-tooltip";
import type { CohortTrendPoint } from "@/modules/doctor/intelligence/types";

export function CohortCharts({ trends }: { trends: CohortTrendPoint[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <ChartCard
        title="Recovery Score Trend"
        question="Are patients recovering better over time?"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="recovery_score"
              name="Recovery"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary) / 0.2)"
              strokeWidth={2.5}
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Medicine Adherence Trend"
        question="Is adherence improving week over week?"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} />
            <Tooltip content={<ChartTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="medicine_adherence"
              name="Adherence %"
              stroke="hsl(var(--secondary))"
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              animationDuration={700}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Readmission Risk Trend"
        question="Is readmission risk coming down?"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="readmission_risk"
              name="Risk"
              stroke="hsl(var(--destructive))"
              fill="hsl(var(--destructive) / 0.15)"
              strokeWidth={2.5}
              animationDuration={700}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}

function ChartCard({
  title,
  question,
  children,
}: {
  title: string;
  question: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card/80 p-4 shadow-soft backdrop-blur-md transition-shadow duration-200 hover:shadow-lift">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mb-3 text-xs text-muted-foreground">{question}</p>
      <div className="h-52">{children}</div>
    </div>
  );
}

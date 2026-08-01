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

import type { CohortTrendPoint } from "@/modules/doctor/intelligence/types";

export function CohortCharts({ trends }: { trends: CohortTrendPoint[] }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <ChartCard title="Recovery Score Trend">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="recovery_score"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary) / 0.2)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Medicine Adherence Trend">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="medicine_adherence"
              name="Adherence %"
              stroke="hsl(var(--secondary))"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Readmission Risk Trend">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trends}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="day" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={28} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="readmission_risk"
              stroke="hsl(var(--destructive))"
              fill="hsl(var(--destructive) / 0.15)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card/70 p-4 shadow-soft backdrop-blur">
      <p className="mb-3 text-sm font-medium">{title}</p>
      <div className="h-52">{children}</div>
    </div>
  );
}

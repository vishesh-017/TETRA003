import type { ReactNode } from "react";
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

import type {
  DistributionBucket,
  HighlightInsight,
} from "@/modules/analytics/types";
import { cn } from "@/lib/utils";

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--warning))",
  "hsl(var(--destructive))",
];

export function HealthIntelligence({
  distributions,
  highlights,
}: {
  distributions: {
    recovery: DistributionBucket[];
    readmission: DistributionBucket[];
    progression: DistributionBucket[];
    adherence: DistributionBucket[];
    appointment: DistributionBucket[];
  };
  highlights: HighlightInsight[];
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">
          Health Intelligence
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Distribution signals that explain where attention belongs.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {highlights.map((h) => (
          <p
            key={h.id}
            className={cn(
              "rounded-2xl border px-3 py-2 text-sm",
              h.tone === "positive" &&
                "border-emerald-500/25 bg-emerald-500/10 text-emerald-900",
              h.tone === "attention" &&
                "border-destructive/25 bg-destructive/10 text-destructive",
              h.tone === "neutral" &&
                "border-border bg-muted/40 text-foreground",
            )}
          >
            {h.text}
          </p>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <DistCard
          title="Recovery distribution"
          question="Where do recovery scores cluster?"
        >
          <BarBlock data={distributions.recovery} color="hsl(var(--primary))" />
        </DistCard>
        <DistCard
          title="Readmission distribution"
          question="How is risk spread across the cohort?"
        >
          <PieBlock data={distributions.readmission} />
        </DistCard>
        <DistCard
          title="Disease progression"
          question="Is progression risk concentrated?"
        >
          <BarBlock
            data={distributions.progression}
            color="hsl(var(--warning))"
          />
        </DistCard>
        <DistCard
          title="Medicine adherence"
          question="Are patients staying on therapy?"
        >
          <BarBlock
            data={distributions.adherence}
            color="hsl(var(--secondary))"
          />
        </DistCard>
        <DistCard
          title="Appointment compliance"
          question="Are follow-ups being completed?"
          className="lg:col-span-2 xl:col-span-2"
        >
          <BarBlock
            data={distributions.appointment}
            color="hsl(var(--primary))"
          />
        </DistCard>
      </div>
    </section>
  );
}

function DistCard({
  title,
  question,
  children,
  className,
}: {
  title: string;
  question: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/80 bg-card/70 p-4 shadow-soft backdrop-blur",
        className,
      )}
    >
      <p className="text-sm font-medium">{title}</p>
      <p className="mb-3 text-xs text-muted-foreground">{question}</p>
      <div className="h-52">{children}</div>
    </div>
  );
}

function BarBlock({
  data,
  color,
}: {
  data: DistributionBucket[];
  color: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
        <Tooltip
          formatter={(value, _n, item) => {
            const pct = (item?.payload as DistributionBucket | undefined)?.pct;
            return [`${value} (${pct ?? 0}%)`, "Patients"];
          }}
        />
        <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function PieBlock({ data }: { data: DistributionBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Tooltip
          formatter={(value, name) => [`${value} patients`, String(name)]}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={48}
          outerRadius={78}
          paddingAngle={3}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

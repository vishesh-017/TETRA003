import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { RiskBadge } from "@/modules/doctor/components/risk-badge";
import type {
  ExecutiveAnalyticsBundle,
  TrendPoint,
} from "@/modules/analytics/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HospitalInsights({
  insights,
}: {
  insights: ExecutiveAnalyticsBundle["hospital_insights"];
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Hospital Insights</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Disease mix, attention list, and whether recovery risk is easing.
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-border/80 bg-card/70 p-4 shadow-soft">
          <p className="text-sm font-medium">Top diseases</p>
          <ul className="mt-3 space-y-2">
            {insights.top_diseases.length ? (
              insights.top_diseases.map((d) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span>{d.name}</span>
                  <span className="font-display text-base font-semibold">
                    {d.count}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">
                No disease labels in the current cohort.
              </li>
            )}
          </ul>

          <p className="mt-5 text-sm font-medium">High-risk patients</p>
          <ul className="mt-3 space-y-2">
            {insights.high_risk_patients.length ? (
              insights.high_risk_patients.map((p) => (
                <li
                  key={p.patient_id}
                  className="rounded-2xl border border-border/70 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      to={`/doctor/patients/${p.patient_id}`}
                      className="font-medium hover:underline"
                    >
                      {p.full_name}
                    </Link>
                    <RiskBadge level={p.risk} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recovery {p.recovery_score} · {p.reason}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-muted-foreground">
                No patients currently require escalated attention.
              </li>
            )}
          </ul>
          <Link
            to="/doctor"
            className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
          >
            Open Intelligence Center
          </Link>
        </div>

        <div className="grid gap-4">
          <MiniTrend
            title="Recovery trends"
            question="Is average recovery improving?"
            data={insights.recovery_trend}
            dataKey="recovery_score"
            color="hsl(var(--primary))"
          />
          <MiniTrend
            title="Medicine adherence trends"
            question="Is adherence getting better?"
            data={insights.adherence_trend}
            dataKey="medicine_adherence"
            color="hsl(var(--secondary))"
          />
          <MiniTrend
            title="Readmission trends"
            question="Is readmission risk decreasing?"
            data={insights.readmission_trend}
            dataKey="readmission_risk"
            color="hsl(var(--destructive))"
          />
        </div>
      </div>
    </section>
  );
}

function MiniTrend({
  title,
  question,
  data,
  dataKey,
  color,
}: {
  title: string;
  question: string;
  data: TrendPoint[];
  dataKey: keyof TrendPoint;
  color: string;
}) {
  return (
    <div className="rounded-3xl border border-border/80 bg-card/70 p-4 shadow-soft">
      <p className="text-sm font-medium">{title}</p>
      <p className="mb-2 text-xs text-muted-foreground">{question}</p>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={24} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

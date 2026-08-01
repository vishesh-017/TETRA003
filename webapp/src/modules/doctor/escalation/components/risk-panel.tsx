import {
  AlertTriangle,
  ArrowLeft,
  FlaskConical,
  Share2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppLocale } from "@/i18n/locale-context";
import type { PatientRiskData } from "@/modules/doctor/escalation/types";
import { cn } from "@/lib/utils";

function scoreColor(score: number) {
  if (score >= 80) return "#e11d48";
  if (score >= 65) return "#ea580c";
  if (score >= 45) return "#d97706";
  return "#059669";
}

interface RiskPanelProps {
  risk: PatientRiskData;
  orderingName?: string | null;
  onBack: () => void;
  onRefer: () => void;
  onOrder: (name: string) => void;
  onOpenChart: () => void;
  onAcknowledge?: () => void;
  onResolve?: () => void;
}

export function RiskPanel({
  risk,
  orderingName,
  onBack,
  onRefer,
  onOrder,
  onOpenChart,
  onAcknowledge,
  onResolve,
}: RiskPanelProps) {
  const { t } = useAppLocale();
  const chartData = risk.disease_scores.map((d) => ({
    name: d.label,
    score: d.score,
  }));

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {t("back_to_queue")}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onOpenChart}>
          {t("open_chart")}
        </Button>
        <Button type="button" size="sm" onClick={onRefer}>
          <Share2 className="mr-1.5 h-4 w-4" />
          {t("refer_patient")}
        </Button>
        {onAcknowledge ? (
          <Button type="button" size="sm" variant="outline" onClick={onAcknowledge}>
            Acknowledge
          </Button>
        ) : null}
        {onResolve ? (
          <Button
            type="button"
            size="sm"
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={onResolve}
          >
            Resolve
          </Button>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 p-5 text-slate-50 shadow-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-200/80">
              {t("risk_panel")}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold">
              {risk.full_name}
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              {risk.primary_diagnosis}
            </p>
          </div>
          <Badge
            className={cn(
              "capitalize",
              risk.risk_level === "critical" && "bg-rose-500 text-white",
              risk.risk_level === "high" && "bg-orange-500 text-white",
              risk.risk_level === "moderate" && "bg-amber-400 text-slate-900",
              risk.risk_level === "low" && "bg-emerald-500 text-white",
            )}
          >
            {risk.risk_level}
          </Badge>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-200">
          {risk.explanation}
        </p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="mb-2 text-xs text-slate-300">
            Higher score = higher disease risk (0–100 screening score from vitals
            — not a lab result or diagnosis).
          </p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#f8fafc",
                  }}
                />
                <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={scoreColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-100">
            <FlaskConical className="h-4 w-4" />
            {t("order_labs")}
          </p>
          <div className="flex flex-wrap gap-2">
            {risk.investigation_options.map((opt) => (
              <Button
                key={opt.id}
                type="button"
                size="sm"
                variant={opt.ordered ? "secondary" : "outline"}
                disabled={opt.ordered || orderingName === opt.name}
                className={cn(
                  !opt.ordered &&
                    "border-white/20 bg-transparent text-white hover:bg-white/10",
                )}
                onClick={() => onOrder(opt.name)}
              >
                {opt.ordered ? t("ordered") : t("order_investigation")} · {opt.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-rose-200">
            <AlertTriangle className="h-4 w-4" />
            {t("red_flags")}
          </p>
          <ul className="space-y-2">
            {risk.red_flags.map((flag) => (
              <li
                key={flag}
                className="rounded-xl border border-rose-400/30 bg-rose-500/15 px-3 py-2 text-sm text-rose-50"
              >
                {flag}
              </li>
            ))}
          </ul>
        </div>

        {risk.referral.recommended ? (
          <div className="mt-5 rounded-xl border border-amber-300/30 bg-amber-400/15 px-3 py-3 text-sm text-amber-50">
            <p className="font-medium">{t("referral_suggested")}</p>
            <p className="mt-1 text-amber-100/90">{risk.referral.message}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

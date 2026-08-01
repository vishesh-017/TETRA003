import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppLocale } from "@/i18n/locale-context";
import { RiskBadge } from "@/modules/doctor/components/risk-badge";
import type {
  EscalationPatientCard,
  RiskFilter,
} from "@/modules/doctor/escalation/types";
import type { RiskLevel } from "@/modules/doctor/types";
import { cn } from "@/lib/utils";

const FILTERS: RiskFilter[] = ["all", "critical", "high", "moderate", "low"];

const CHIP_STYLE: Record<RiskFilter, string> = {
  all: "border-border bg-background",
  critical: "border-rose-500/40 bg-rose-500/10 text-rose-800",
  high: "border-orange-500/40 bg-orange-500/10 text-orange-800",
  moderate: "border-amber-500/40 bg-amber-500/10 text-amber-900",
  low: "border-emerald-500/40 bg-emerald-500/10 text-emerald-800",
};

interface ActivePanelProps {
  patients: EscalationPatientCard[];
  counts: Record<RiskFilter, number>;
  search: string;
  riskFilter: RiskFilter;
  selectedId?: string | null;
  onSearchChange: (value: string) => void;
  onRiskFilterChange: (value: RiskFilter) => void;
  onOpen: (patientId: string) => void;
}

export function ActivePanel({
  patients,
  counts,
  search,
  riskFilter,
  selectedId,
  onSearchChange,
  onRiskFilterChange,
  onOpen,
}: ActivePanelProps) {
  const { t } = useAppLocale();

  return (
    <section className="flex min-h-0 flex-col gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Triage
        </p>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          {t("active_panel")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("active_panel_hint")}
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("search_patients")}
          className="pl-9"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onRiskFilterChange(key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition",
              CHIP_STYLE[key],
              riskFilter === key && "ring-2 ring-primary/30",
            )}
          >
            {key === "all" ? "All" : key}
            <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5">
              {counts[key]}
            </Badge>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {patients.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-10 text-center text-sm text-muted-foreground">
            {t("no_match_patients")}
          </div>
        ) : (
          patients.map((p) => (
            <article
              key={p.id}
              className={cn(
                "rounded-2xl border bg-card p-4 shadow-sm transition hover:border-primary/30",
                selectedId === p.id && "border-primary/50 ring-2 ring-primary/15",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-xl font-semibold">
                      {p.full_name}
                    </h3>
                    <RiskBadge level={p.risk_level as RiskLevel} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {p.primary_diagnosis}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("discharged_label")} {p.discharge_date || "—"} ·{" "}
                    {p.district}
                    {p.age != null ? ` · ${p.age} yrs` : ""}
                  </p>
                </div>
                <Button size="sm" onClick={() => onOpen(p.id)}>
                  {t("open_patient")}
                </Button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

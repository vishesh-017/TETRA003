import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  FileUp,
  QrCode,
  ShieldAlert,
  UserPlus,
} from "lucide-react";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { ActivePanel } from "@/modules/doctor/escalation/components/active-panel";
import { useEscalationBundle } from "@/modules/doctor/escalation/hooks";
import type { RiskFilter } from "@/modules/doctor/escalation/types";
import { cn } from "@/lib/utils";

function doctorDisplayName(fullName?: string | null) {
  const raw = (fullName || "Doctor").trim();
  if (/^dr\.?\s+/i.test(raw)) return raw.replace(/^dr\.?\s+/i, "Dr. ");
  return `Dr. ${raw}`;
}

export function DoctorHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const bundle = useEscalationBundle();
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");

  const filtered = useMemo(() => {
    const rows = bundle.data?.patients ?? [];
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (riskFilter !== "all" && p.risk_level !== riskFilter) return false;
      if (!q) return true;
      return (
        p.full_name.toLowerCase().includes(q) ||
        p.primary_diagnosis.toLowerCase().includes(q)
      );
    });
  }, [bundle.data?.patients, search, riskFilter]);

  const counts = bundle.data?.counts ?? {
    all: 0,
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
  };

  if (bundle.isLoading) return <LoadingScreen fullScreen={false} />;
  if (bundle.isError || !bundle.data) {
    return (
      <ErrorState
        title="Unable to load doctor home"
        description={bundle.error?.message}
        onRetry={() => void bundle.refetch()}
      />
    );
  }

  const openEscalations = counts.critical + counts.high;
  const greetingName = doctorDisplayName(user?.full_name);

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5 pb-10">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-950 via-teal-900 to-emerald-900 p-5 text-white shadow-lg sm:p-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-center">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-100/90">
              Doctor workspace
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-[2.15rem]">
              Namaste, {greetingName}
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-teal-50/85">
              Your active panel is risk-sorted. Triage escalations, link patients
              by username/QR, and keep follow-ups on track.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                to="/doctor/patients"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-white/30 bg-transparent text-white hover:bg-white/10",
                )}
              >
                <UserPlus className="mr-1.5 h-4 w-4" />
                Register patient
              </Link>
              <Link
                to="/doctor/patients"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-white/30 bg-transparent text-white hover:bg-white/10",
                )}
              >
                <QrCode className="mr-1.5 h-4 w-4" />
                Scanner / QR link
              </Link>
              <Link
                to="/doctor/reports"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "border-white/30 bg-transparent text-white hover:bg-white/10",
                )}
              >
                <FileUp className="mr-1.5 h-4 w-4" />
                Reports
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2">
            {[
              { label: "Total patients", value: counts.all },
              { label: "Critical", value: counts.critical },
              { label: "High risk", value: counts.high },
              { label: "Open escalations", value: openEscalations },
            ].map((tile) => (
              <div
                key={tile.label}
                className="flex min-h-[88px] flex-col justify-between rounded-2xl border border-white/10 bg-white/10 px-3.5 py-3 backdrop-blur"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-100/80">
                  {tile.label}
                </p>
                <p className="font-display text-3xl font-semibold tabular-nums leading-none">
                  {tile.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {openEscalations > 0 ? (
        <Link
          to="/doctor/escalations"
          className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-900 transition hover:bg-rose-100"
        >
          <span className="inline-flex items-center gap-2 text-sm font-medium">
            <ShieldAlert className="h-4 w-4" />
            {openEscalations} open escalation
            {openEscalations === 1 ? "" : "s"} require your review.
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}

      <ActivePanel
        patients={filtered}
        counts={counts}
        search={search}
        riskFilter={riskFilter}
        selectedId={null}
        onSearchChange={setSearch}
        onRiskFilterChange={setRiskFilter}
        onOpen={(id) => navigate(`/doctor/escalations?patient=${id}`)}
      />
    </div>
  );
}

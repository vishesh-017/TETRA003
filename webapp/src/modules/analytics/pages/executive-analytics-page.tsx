import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { AiWeeklySummaryPanel } from "@/modules/analytics/components/ai-weekly-summary";
import { AnalyticsFiltersBar } from "@/modules/analytics/components/analytics-filters";
import { AnalyticsSkeleton } from "@/modules/analytics/components/analytics-skeleton";
import { DoctorPerformance } from "@/modules/analytics/components/doctor-performance";
import { HealthIntelligence } from "@/modules/analytics/components/health-intelligence";
import { HospitalInsights } from "@/modules/analytics/components/hospital-insights";
import { HospitalMapPanel } from "@/modules/analytics/components/hospital-map-panel";
import { InteractiveReports } from "@/modules/analytics/components/interactive-reports";
import { KpiStrip } from "@/modules/analytics/components/kpi-strip";
import { RecoveryAnalytics } from "@/modules/analytics/components/recovery-analytics";
import {
  useAnalyticsFilters,
  useAnalyticsRealtimeInvalidation,
  useExecutiveAnalytics,
} from "@/modules/analytics/hooks";
import { cn } from "@/lib/utils";

export function ExecutiveAnalyticsPage() {
  const { filters, setFilters, reset } = useAnalyticsFilters();
  useAnalyticsRealtimeInvalidation();
  const query = useExecutiveAnalytics(filters);

  if (query.isLoading) return <AnalyticsSkeleton />;
  if (query.isError || !query.data) {
    return (
      <ErrorState
        title="Unable to load Executive Analytics"
        description={query.error?.message || "Please try again."}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const data = query.data;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 pb-12">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Decision support
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Executive Analytics
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Insight-driven recovery intelligence — how patients are recovering,
            where attention is needed, and whether follow-ups and adherence are
            working. Cohort size: {data.cohort_size}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/doctor"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Intelligence Center
          </Link>
          <Link
            to="/doctor/appointments"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Follow-ups
          </Link>
        </div>
      </motion.header>

      <KpiStrip kpis={data.kpis} />

      <AnalyticsFiltersBar
        filters={filters}
        onChange={setFilters}
        onReset={reset}
        diseases={data.filter_options.diseases}
        doctors={data.filter_options.doctors}
      />

      <AiWeeklySummaryPanel summary={data.weekly_summary} />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <RecoveryAnalytics series={data.recovery_series} />
        <InteractiveReports />
      </div>

      <HealthIntelligence
        distributions={data.distributions}
        highlights={data.highlights}
      />

      <HospitalInsights insights={data.hospital_insights} />

      <DoctorPerformance rows={data.doctor_performance} />

      <HospitalMapPanel hospitals={data.hospitals} />
    </div>
  );
}

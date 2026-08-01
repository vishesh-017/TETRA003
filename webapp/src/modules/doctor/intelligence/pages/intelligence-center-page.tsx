import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { AlertCenter } from "@/modules/doctor/intelligence/components/alert-center";
import { CohortCharts } from "@/modules/doctor/intelligence/components/cohort-charts";
import { CommandFilters } from "@/modules/doctor/intelligence/components/command-filters";
import { InsightsPanelIntel } from "@/modules/doctor/intelligence/components/insights-panel";
import { IntelligenceSkeleton } from "@/modules/doctor/intelligence/components/intelligence-skeleton";
import { PriorityQueue } from "@/modules/doctor/intelligence/components/priority-queue";
import { SummaryStrip } from "@/modules/doctor/intelligence/components/summary-strip";
import {
  useDoctorIntelligence,
  useDoctorRealtimeInvalidation,
  useIntelligenceFilters,
  useOfflineSyncPendingAlert,
} from "@/modules/doctor/intelligence/hooks";
import { cn } from "@/lib/utils";

export function IntelligenceCenterPage() {
  const { filters, setFilters, reset } = useIntelligenceFilters();
  const [stripFilter, setStripFilter] = useState("");
  useDoctorRealtimeInvalidation();
  const offlinePending = useOfflineSyncPendingAlert();

  const effectiveFilters = useMemo(() => {
    const next = { ...filters };
    if (stripFilter === "high_risk") next.risk = next.risk || "high";
    if (stripFilter === "emergency") next.risk = "critical";
    if (stripFilter === "appointments") next.appointment = "has_upcoming";
    return next;
  }, [filters, stripFilter]);

  const intel = useDoctorIntelligence(effectiveFilters);

  if (intel.isLoading) return <IntelligenceSkeleton />;
  if (intel.isError || !intel.data) {
    return (
      <ErrorState
        title="Unable to load Intelligence Center"
        description={intel.error?.message || "Please try again."}
        onRetry={() => void intel.refetch()}
      />
    );
  }

  const data = intel.data;

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5 pb-10">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            HealNexus
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Doctor Intelligence Center
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Instantly see who needs attention, why, and what to do next —
            assistive insights, clinician control.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/doctor/appointments"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Follow-ups
          </Link>
          <Link
            to="/doctor/patients"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            All patients
          </Link>
          <Link to="/doctor/analytics" className={cn(buttonVariants())}>
            Executive Analytics
          </Link>
        </div>
      </motion.header>

      <SummaryStrip
        summary={data.summary}
        active={stripFilter}
        onSelect={(hint) =>
          setStripFilter((prev) => (prev === hint ? "" : hint))
        }
      />

      <CommandFilters
        filters={filters}
        onChange={setFilters}
        onReset={reset}
        diseases={data.diseases}
        healthWorkers={data.health_workers}
      />

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">
              Patient Priority Queue
            </h2>
            <p className="text-xs text-muted-foreground">
              Critical patients first · {data.priority_queue.length} shown
            </p>
          </div>
          <PriorityQueue patients={data.priority_queue} />
        </div>

        <div className="space-y-4">
          <InsightsPanelIntel insights={data.insights} />
          <AlertCenter
            alerts={data.alerts}
            offlinePending={offlinePending.data}
          />
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl font-semibold">
          Cohort Analytics
        </h2>
        <CohortCharts trends={data.trends} />
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { buttonVariants } from "@/components/ui/button";
import { CohortCharts } from "@/modules/doctor/intelligence/components/cohort-charts";
import { IntelligenceSkeleton } from "@/modules/doctor/intelligence/components/intelligence-skeleton";
import {
  useDoctorIntelligence,
  useDoctorRealtimeInvalidation,
  useIntelligenceFilters,
} from "@/modules/doctor/intelligence/hooks";
import { cn } from "@/lib/utils";

export function DoctorAnalyticsPage() {
  const { filters } = useIntelligenceFilters();
  useDoctorRealtimeInvalidation();
  const intel = useDoctorIntelligence(filters);

  if (intel.isLoading) return <IntelligenceSkeleton />;
  if (intel.isError || !intel.data) {
    return (
      <ErrorState
        description="Unable to load analytics."
        onRetry={() => void intel.refetch()}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            Cohort Analytics
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Exactly three charts — recovery, adherence, and readmission risk.
          </p>
        </div>
        <Link to="/doctor" className={cn(buttonVariants({ variant: "outline" }))}>
          Back to Intelligence Center
        </Link>
      </div>
      <AiDisclaimer />
      <CohortCharts trends={intel.data.trends} />
    </div>
  );
}

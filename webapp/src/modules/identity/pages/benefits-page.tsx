import { Link } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BenefitsDashboard } from "@/modules/identity/components/benefits-dashboard";
import { useBenefitsDashboard } from "@/modules/identity/hooks";

export function BenefitsPage() {
  const query = useBenefitsDashboard();

  if (query.isLoading)
    return <LoadingScreen label="Loading benefits…" fullScreen={false} />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        description="Could not load government benefits."
        onRetry={() => void query.refetch()}
      />
    );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Government Benefits
          </p>
          <h1 className="font-display text-3xl font-semibold">
            Benefits Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            PM-JAY, ABHA, linked records, and documents in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/government/pmjay"
            className={cn(buttonVariants())}
          >
            PM-JAY Assistant
          </Link>
          <Link
            to="/government/abha"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            ABHA Import
          </Link>
        </div>
      </div>

      <BenefitsDashboard data={query.data} />
    </div>
  );
}

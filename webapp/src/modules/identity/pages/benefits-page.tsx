import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { buttonVariants } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BenefitsDashboard } from "@/modules/identity/components/benefits-dashboard";
import { PmjayWizard } from "@/modules/identity/components/pmjay-wizard";
import { useBenefitsDashboard } from "@/modules/identity/hooks";

const TABS = [
  { id: "overview", label: "Benefits overview" },
  { id: "pmjay", label: "PM-JAY Assistant" },
];

export function BenefitsPage() {
  const query = useBenefitsDashboard();
  const [params, setParams] = useSearchParams();
  const initial = params.get("tab") === "pmjay" ? "pmjay" : "overview";
  const [tab, setTab] = useState(initial);

  const active = useMemo(() => {
    const fromUrl = params.get("tab");
    if (fromUrl === "pmjay" || fromUrl === "overview") return fromUrl;
    return tab;
  }, [params, tab]);

  const changeTab = (next: string) => {
    setTab(next);
    setParams(next === "overview" ? {} : { tab: next }, { replace: true });
  };

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
            Benefits & PM-JAY
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Eligibility, coverage pathways, ABHA, and documents — one place.
          </p>
        </div>
        <Link
          to="/government/abha"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          ABHA Import
        </Link>
      </div>

      <Tabs tabs={TABS} value={active} onChange={changeTab} />

      {active === "overview" ? (
        <BenefitsDashboard data={query.data} />
      ) : (
        <div className="space-y-4">
          <AiDisclaimer />
          <PmjayWizard />
          <Link
            to="/maps"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Find PM-JAY hospitals →
          </Link>
        </div>
      )}
    </div>
  );
}

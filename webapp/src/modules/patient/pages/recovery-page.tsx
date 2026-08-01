import { Link } from "react-router-dom";

import {
  AlertBanner,
  InsightsPanel,
  RecoveryCard,
  RiskCard,
  TrendCard,
} from "@/components/health-engine";
import { buttonVariants } from "@/components/ui/button";
import { useHealthIntelligence } from "@/hooks/health-engine";
import { cn } from "@/lib/utils";

export function RecoveryPage() {
  const intel = useHealthIntelligence();

  if (!intel) {
    return (
      <div className="mx-auto max-w-xl space-y-4 pb-10">
        <h1 className="font-display text-3xl font-semibold">Recovery</h1>
        <p className="text-sm text-muted-foreground">
          Sign in as a patient. Score updates from check-ins, medicines, and
          vitals in the live store.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Recovery</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live score from your check-ins, adherence, and risk engine — not a
            static card.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/patient/ai-checkup" className={cn(buttonVariants())}>
            Run AI Checkup
          </Link>
          <Link
            to="/patient/care-plan"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Care plan & simulator
          </Link>
        </div>
      </div>

      <AlertBanner alert={intel.alerts} />
      <RecoveryCard recovery={intel.recovery} />
      <RiskCard
        readmission={intel.readmission}
        progression={intel.progression.assessments}
      />
      <InsightsPanel explain={intel.explain} recovery={intel.recovery} />
      <TrendCard trends={intel.trends} />
    </div>
  );
}

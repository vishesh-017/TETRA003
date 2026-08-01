import { Link } from "react-router-dom";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
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
        <h1 className="font-display text-3xl font-semibold">
          Health Intelligence
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in as a patient to evaluate recovery signals.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 pb-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            Health Intelligence
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Continuous post-discharge monitoring in the app — assistive only.
            Doctors decide.
          </p>
        </div>
        <Link
          to="/patient/lifestyle-simulator"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Open Lifestyle Simulator
        </Link>
      </div>

      <AiDisclaimer />
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

import { Link } from "react-router-dom";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PmjayWizard } from "@/modules/identity/components/pmjay-wizard";

export function PmjayPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Government Benefits
        </p>
        <h1 className="font-display text-3xl font-semibold">PM-JAY Assistant</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Conversational guidance for Ayushman Bharat — not a live government API.
        </p>
      </div>
      <AiDisclaimer />
      <PmjayWizard />
      <div className="flex flex-wrap gap-2">
        <Link
          to="/government/benefits"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Benefits dashboard
        </Link>
        <Link
          to="/maps"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Find hospitals
        </Link>
      </div>
    </div>
  );
}

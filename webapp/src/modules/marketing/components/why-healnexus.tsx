import { Check, X } from "lucide-react";

import { Section } from "@/modules/marketing/components/section";
import { WHY_ROWS } from "@/modules/marketing/data";

export function WhyHealNexusSection() {
  return (
    <Section
      id="why"
      eyebrow="Why HealNexus"
      title="Traditional follow-up vs continuous care"
      description="Replace guesswork with visibility — without taking judgement away from clinicians."
    >
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-card/70 shadow-soft">
        <div className="grid grid-cols-2 border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">
          <div className="px-4 py-3 sm:px-6">Traditional care</div>
          <div className="px-4 py-3 text-primary sm:px-6">HealNexus</div>
        </div>
        {WHY_ROWS.map((row) => (
          <div
            key={row.healnexus}
            className="grid grid-cols-2 border-b border-border/70 last:border-0"
          >
            <div className="flex items-start gap-2 px-4 py-4 text-sm text-muted-foreground sm:px-6">
              <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive/70" />
              {row.traditional}
            </div>
            <div className="flex items-start gap-2 bg-primary/[0.04] px-4 py-4 text-sm font-medium sm:px-6">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
              {row.healnexus}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

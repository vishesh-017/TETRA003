import { Check } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Section } from "@/modules/marketing/components/section";
import { PRICING } from "@/modules/marketing/data";

export function PricingSection() {
  return (
    <Section
      id="pricing"
      eyebrow="Pricing"
      title="Scale your care network"
      description="Simple, transparent plans for clinics and hospitals."
    >
      <div className="grid gap-12 lg:grid-cols-3 max-w-5xl mx-auto">
        {PRICING.map((plan) => (
          <article
            key={plan.id}
            className="flex flex-col border-t border-border pt-8"
          >
            <div className="flex justify-between items-baseline mb-4">
              <h3 className="font-display text-2xl font-semibold tracking-tight">{plan.name}</h3>
              {plan.featured && (
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
                  Most popular
                </span>
              )}
            </div>
            
            <p className="mt-1 text-sm text-muted-foreground min-h-[40px]">{plan.blurb}</p>
            
            <p className="mt-8 font-display text-5xl font-medium tracking-tight">
              {plan.price}
              <span className="text-lg font-normal text-muted-foreground ml-1">
                {plan.period}
              </span>
            </p>
            
            <Link
              to="/signup"
              className={cn(
                buttonVariants({
                  variant: plan.featured ? "default" : "outline",
                }),
                "mt-8 w-full rounded-full",
              )}
            >
              Get Started
            </Link>

            <ul className="mt-12 flex-1 space-y-4 text-sm text-muted-foreground">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-3 items-start">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                  <span className="text-foreground/80">{f}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}

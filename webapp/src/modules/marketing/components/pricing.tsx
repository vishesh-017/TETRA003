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
      title="Plans that grow with your care network"
      description="Demo pricing for product walkthroughs — not commercial offers."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {PRICING.map((plan) => (
          <article
            key={plan.id}
            className={cn(
              "relative flex flex-col rounded-3xl border p-6 shadow-soft backdrop-blur",
              plan.featured
                ? "border-primary/40 bg-gradient-to-b from-primary/10 to-card/90 shadow-lift"
                : "border-border/80 bg-card/70",
            )}
          >
            {plan.featured ? (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground">
                Most popular
              </span>
            ) : null}
            <h3 className="font-display text-xl font-semibold">{plan.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
            <p className="mt-5 font-display text-4xl font-semibold tracking-tight">
              {plan.price}
              <span className="text-base font-medium text-muted-foreground">
                {plan.period}
              </span>
            </p>
            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className={cn(
                buttonVariants({
                  variant: plan.featured ? "default" : "outline",
                }),
                "mt-6 w-full",
              )}
            >
              Get Started
            </Link>
          </article>
        ))}
      </div>
    </Section>
  );
}

import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ContactSection } from "@/modules/marketing/components/contact";
import { FaqSection } from "@/modules/marketing/components/faq";
import { FeaturesSection } from "@/modules/marketing/components/features";
import { HeroSection } from "@/modules/marketing/components/hero";
import { HowItWorksSection } from "@/modules/marketing/components/how-it-works";
import { PricingSection } from "@/modules/marketing/components/pricing";
import { TestimonialsSection } from "@/modules/marketing/components/testimonials";
import { TrustedBySection } from "@/modules/marketing/components/trusted-by";
import { WhyHealNexusSection } from "@/modules/marketing/components/why-healnexus";

export function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }, [location.hash]);

  return (
    <>
      <HeroSection />
      <TrustedBySection />
      <FeaturesSection limit={6} />
      <div className="mx-auto max-w-6xl px-4 pb-4 text-center sm:px-6">
        <Link
          to="/features"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Explore all features
        </Link>
      </div>
      <HowItWorksSection />
      <WhyHealNexusSection />
      <PricingSection />
      <TestimonialsSection />
      <FaqSection />
      <ContactSection />
      <section className="border-t border-border/70 bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Ready to see continuity of care done right?
          </h2>
          <p className="mt-3 text-sm text-muted-foreground sm:text-base">
            Jump into a demo workspace as a doctor, patient, caregiver, or
            health worker in seconds.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Get Started
            </Link>
            <Link
              to="/login"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

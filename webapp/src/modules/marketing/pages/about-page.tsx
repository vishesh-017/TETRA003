import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Section } from "@/modules/marketing/components/section";
import { WhyHealNexusSection } from "@/modules/marketing/components/why-healnexus";

export function AboutPage() {
  return (
    <div className="pt-6">
      <Section
        eyebrow="About"
        title="Beyond hospital walls"
        description="HealNexus is an AI Care Companion platform for post-discharge continuity — connecting patients, doctors, caregivers, and rural health workers."
      >
        <div className="mx-auto max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p>
            Too many patients fall through the cracks after leaving the hospital.
            HealNexus makes recovery visible: daily check-ins, medicine
            adherence, recovery scores, and clinician-ready priority queues.
          </p>
          <p>
            Our AI assists with organization, education, and monitoring. It does
            not diagnose or prescribe. Doctors remain in control — always.
          </p>
          <p>
            From Ahmedabad hospital maps and PM-JAY guidance to offline rural
            workflows, HealNexus is built for India’s continuum of care.
          </p>
          <div className="pt-2">
            <Link to="/signup" className={cn(buttonVariants())}>
              Get Started
            </Link>
          </div>
        </div>
      </Section>
      <WhyHealNexusSection />
    </div>
  );
}

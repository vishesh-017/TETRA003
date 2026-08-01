import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { BentoFeatures } from "@/modules/marketing/landing/bento-features";
import { DoctorPreview } from "@/modules/marketing/landing/doctor-preview";
import { FinalCta } from "@/modules/marketing/landing/final-cta";
import { ImmersiveHero } from "@/modules/marketing/landing/immersive-hero";
import { JourneyTimeline } from "@/modules/marketing/landing/journey-timeline";
import { PatientPreview } from "@/modules/marketing/landing/patient-preview";
import { StatsSection } from "@/modules/marketing/landing/stats-section";
import { TestimonialsSection } from "@/modules/marketing/landing/testimonials-section";

export function LandingPage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const el = document.getElementById(id);
    if (el) {
      window.setTimeout(() => {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  }, [location.hash]);

  return (
    <div className="relative overflow-x-clip bg-[#FAFCFF]">
      <ImmersiveHero />
      <BentoFeatures />
      <JourneyTimeline />
      <DoctorPreview />
      <PatientPreview />
      <StatsSection />
      <TestimonialsSection />
      <FinalCta />
    </div>
  );
}

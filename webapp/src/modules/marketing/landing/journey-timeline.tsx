import { motion } from "framer-motion";
import {
  Activity,
  BellRing,
  Brain,
  Building2,
  FileCheck2,
  HeartPulse,
  Home,
  Stethoscope,
} from "lucide-react";

import { Reveal, SectionEyebrow } from "@/modules/marketing/landing/reveal";

const STEPS = [
  { title: "Hospital", body: "Admission & care episode", icon: Building2 },
  { title: "Discharge", body: "Clinical summary finalized", icon: FileCheck2 },
  { title: "AI Care Plan", body: "Structured recovery draft", icon: Brain },
  { title: "Patient Home", body: "Plan delivered to devices", icon: Home },
  { title: "Daily Monitoring", body: "Check-ins & adherence", icon: Activity },
  { title: "AI Prediction", body: "Risk & recovery scores", icon: HeartPulse },
  { title: "Doctor Alert", body: "Escalations when needed", icon: BellRing },
  { title: "Healthy Recovery", body: "Closed-loop continuity", icon: Stethoscope },
];

export function JourneyTimeline() {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/25 to-transparent" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <SectionEyebrow>How it works</SectionEyebrow>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-5xl">
            From ward to home —{" "}
            <span className="hn-gradient-text">one continuous loop</span>
          </h2>
          <p className="mt-4 text-base text-[#64748B] sm:text-lg">
            A horizontal care journey that keeps hospitals, clinicians, and
            families synchronized.
          </p>
        </Reveal>

        <div className="relative mt-12">
          <div className="pointer-events-none absolute left-0 right-0 top-[3.25rem] hidden h-px bg-gradient-to-r from-[#2563EB]/10 via-[#14B8A6]/50 to-[#22C55E]/20 lg:block" />

          <div className="flex gap-4 overflow-x-auto pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:grid lg:grid-cols-8 lg:gap-3 lg:overflow-visible [&::-webkit-scrollbar]:hidden">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.title} delay={i * 0.05} className="min-w-[148px] flex-1">
                  <motion.div
                    whileHover={{ y: -6 }}
                    className="hn-glass relative flex h-full flex-col rounded-2xl p-4"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] text-white shadow-[0_8px_20px_rgba(37,99,235,0.3)]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
                      Step {i + 1}
                    </p>
                    <h3 className="mt-1 text-center text-sm font-bold text-[#0F172A]">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-center text-[11px] leading-snug text-[#64748B]">
                      {step.body}
                    </p>
                  </motion.div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

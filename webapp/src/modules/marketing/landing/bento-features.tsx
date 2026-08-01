import { motion } from "framer-motion";
import {
  BrainCircuit,
  ClipboardList,
  Fingerprint,
  Hospital,
  MapPinned,
  RadioTower,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

import { Reveal, SectionEyebrow } from "@/modules/marketing/landing/reveal";

/** Ordered bento: hero feature first, then paired insights, then supporting modules. */
const FEATURES = [
  {
    title: "AI Care Plans",
    body: "Doctor-approved recovery journeys generated at discharge — structured, versioned, and ready for home.",
    icon: Sparkles,
    className: "md:col-span-2 md:row-span-2",
    gradient: "from-[#2563EB]/15 via-[#14B8A6]/8 to-transparent",
  },
  {
    title: "Readmission Prediction",
    body: "Explainable risk scores that surface who needs attention before complications escalate.",
    icon: BrainCircuit,
    className: "md:col-span-1",
    gradient: "from-[#14B8A6]/14 to-transparent",
  },
  {
    title: "Offline Rural Screening",
    body: "Field kits that sync when connectivity returns — built for real Indian infrastructure.",
    icon: RadioTower,
    className: "md:col-span-1",
    gradient: "from-[#22C55E]/12 to-transparent",
  },
  {
    title: "Patient Passport",
    body: "A living clinical identity — medicines, allergies, timeline, and emergency access in one wallet.",
    icon: WalletCards,
    className: "md:col-span-1",
    gradient: "from-[#2563EB]/10 to-transparent",
  },
  {
    title: "PM-JAY & Benefits",
    body: "Eligibility clarity and benefit pathways that help patients navigate coverage with confidence.",
    icon: ShieldCheck,
    className: "md:col-span-1",
    gradient: "from-[#14B8A6]/12 to-transparent",
  },
  {
    title: "ABDM-ready Identity",
    body: "Architecture ready for ABHA-linked records and interoperable health data exchange.",
    icon: Fingerprint,
    className: "md:col-span-1",
    gradient: "from-[#2563EB]/12 to-transparent",
  },
  {
    title: "Hospital Finder",
    body: "Map nearby facilities with live location and PM-JAY context so next steps are clear.",
    icon: MapPinned,
    className: "md:col-span-1",
    gradient: "from-[#22C55E]/10 to-transparent",
  },
  {
    title: "Explainable AI",
    body: "Every recommendation ships with rationale. AI assists — clinicians decide.",
    icon: ClipboardList,
    className: "md:col-span-1",
    gradient: "from-[#14B8A6]/10 to-transparent",
  },
  {
    title: "Enterprise Continuity",
    body: "Doctor, patient, caregiver, and health worker workflows on one shared care graph.",
    icon: Hospital,
    className: "md:col-span-2",
    gradient: "from-[#2563EB]/12 via-transparent to-[#14B8A6]/10",
  },
];

export function BentoFeatures() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Platform</SectionEyebrow>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-5xl">
            Everything continuity of care needs —{" "}
            <span className="hn-gradient-text">in one system</span>
          </h2>
          <p className="mt-4 text-base text-[#64748B] sm:text-lg">
            Purpose-built modules arranged for clarity — care first, identity and
            coverage next, continuity across the whole team.
          </p>
        </Reveal>

        <div className="mt-12 grid auto-rows-[minmax(168px,auto)] gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={i * 0.04} className={f.className}>
                <motion.article
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 320, damping: 22 }}
                  className="hn-card-premium group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] p-6"
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-80 transition group-hover:opacity-100`}
                  />
                  <div className="relative flex h-full flex-col">
                    <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-[#0F172A]/06">
                      <Icon className="h-5 w-5 text-[#2563EB]" />
                    </div>
                    <h3 className="font-display mt-5 text-xl font-bold text-[#0F172A]">
                      {f.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[#64748B]">
                      {f.body}
                    </p>
                  </div>
                </motion.article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

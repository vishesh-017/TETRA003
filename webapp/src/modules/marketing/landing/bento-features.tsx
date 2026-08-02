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
    gradient: "from-[#1D4ED8]/20 via-[#0D9488]/12 to-transparent",
    accent: "#2563EB",
    tag: "Core",
  },
  {
    title: "Readmission Prediction",
    body: "Explainable risk scores that surface who needs attention before complications escalate.",
    icon: BrainCircuit,
    className: "md:col-span-1",
    gradient: "from-[#0D9488]/18 to-transparent",
    accent: "#0D9488",
    tag: "Risk",
  },
  {
    title: "Offline Rural Screening",
    body: "Field kits that sync when connectivity returns — built for real Indian infrastructure.",
    icon: RadioTower,
    className: "md:col-span-1",
    gradient: "from-[#16A34A]/16 to-transparent",
    accent: "#16A34A",
    tag: "Field",
  },
  {
    title: "Patient Passport",
    body: "A living clinical identity — medicines, allergies, timeline, and emergency access in one wallet.",
    icon: WalletCards,
    className: "md:col-span-1",
    gradient: "from-[#1D4ED8]/14 to-transparent",
    accent: "#2563EB",
    tag: "Identity",
  },
  {
    title: "PM-JAY & Benefits",
    body: "Eligibility clarity and benefit pathways that help patients navigate coverage with confidence.",
    icon: ShieldCheck,
    className: "md:col-span-1",
    gradient: "from-[#0D9488]/14 to-transparent",
    accent: "#0D9488",
    tag: "Coverage",
  },
  {
    title: "ABDM-ready Identity",
    body: "Architecture ready for ABHA-linked records and interoperable health data exchange.",
    icon: Fingerprint,
    className: "md:col-span-1",
    gradient: "from-[#1D4ED8]/12 to-transparent",
    accent: "#1D4ED8",
    tag: "ABDM",
  },
  {
    title: "Hospital Finder",
    body: "Map nearby facilities with live location and PM-JAY context so next steps are clear.",
    icon: MapPinned,
    className: "md:col-span-1",
    gradient: "from-[#16A34A]/12 to-transparent",
    accent: "#15803D",
    tag: "Access",
  },
  {
    title: "Explainable AI",
    body: "Every recommendation ships with rationale. AI assists — clinicians decide.",
    icon: ClipboardList,
    className: "md:col-span-1",
    gradient: "from-[#0D9488]/12 to-transparent",
    accent: "#0F766E",
    tag: "Trust",
  },
  {
    title: "Enterprise Continuity",
    body: "Doctor, patient, caregiver, and health worker workflows on one shared care graph.",
    icon: Hospital,
    className: "md:col-span-2",
    gradient: "from-[#1D4ED8]/14 via-transparent to-[#0D9488]/12",
    accent: "#1E40AF",
    tag: "Team",
  },
];

export function BentoFeatures() {
  return (
    <section id="features" className="relative overflow-hidden py-20 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-[420px] max-w-5xl rounded-full bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.08),transparent_70%)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
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

        <div className="mt-12 grid auto-rows-[minmax(180px,auto)] gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            const isHero = i === 0;
            return (
              <Reveal key={f.title} delay={i * 0.045} className={f.className}>
                <motion.article
                  whileHover={{ y: -6 }}
                  transition={{ type: "spring", stiffness: 340, damping: 24 }}
                  className="hn-card-premium group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] ring-1 ring-[#0F172A]/[0.04] transition-shadow hover:shadow-[0_28px_60px_-30px_rgba(37,99,235,0.45)]"
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-90 transition duration-500 group-hover:opacity-100`}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-40 blur-2xl transition group-hover:opacity-70"
                    style={{ background: f.accent }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gradient-to-r from-transparent via-current to-transparent opacity-80 transition duration-500 group-hover:scale-x-100"
                    style={{ color: f.accent }}
                  />

                  <div className="relative flex h-full flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <motion.div
                        whileHover={{ rotate: -6, scale: 1.05 }}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md ring-1 ring-[#0F172A]/06"
                      >
                        <Icon className="h-5 w-5" style={{ color: f.accent }} />
                      </motion.div>
                      <span
                        className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#475569] shadow-sm ring-1 ring-[#0F172A]/05"
                      >
                        {f.tag}
                      </span>
                    </div>
                    <h3
                      className={`font-display mt-5 font-bold tracking-tight text-[#0F172A] ${
                        isHero ? "text-2xl sm:text-3xl" : "text-xl"
                      }`}
                    >
                      {f.title}
                    </h3>
                    <p
                      className={`mt-2 flex-1 leading-relaxed text-[#64748B] ${
                        isHero ? "text-base" : "text-sm"
                      }`}
                    >
                      {f.body}
                    </p>
                    {isHero ? (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {["Discharge → home", "Versioned plans", "Doctor approved"].map(
                          (chip) => (
                            <span
                              key={chip}
                              className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#1E3A8A] shadow-sm ring-1 ring-[#2563EB]/15"
                            >
                              {chip}
                            </span>
                          ),
                        )}
                      </div>
                    ) : (
                      <div
                        className="mt-4 h-1 w-10 rounded-full opacity-80 transition-all duration-500 group-hover:w-16"
                        style={{ background: f.accent }}
                      />
                    )}
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

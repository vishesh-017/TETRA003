import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BellRing,
  Building2,
  HeartPulse,
  Home,
  Pill,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import { AmbientBackground } from "@/modules/marketing/landing/ambient-background";
import { roleHomePath } from "@/services/auth.service";

const JOURNEY = [
  { label: "Hospital", icon: Building2 },
  { label: "AI Plan", icon: Sparkles },
  { label: "Home", icon: Home },
  { label: "Monitor", icon: Activity },
  { label: "Doctor", icon: Stethoscope },
  { label: "Recovery", icon: HeartPulse },
];

export function ImmersiveHero() {
  const { isAuthenticated, user } = useAuth();
  const primaryHref =
    isAuthenticated && user ? roleHomePath(user.role) : "/signup";
  const primaryLabel =
    isAuthenticated && user ? "Open dashboard" : "Get Started";

  return (
    <section
      id="home"
      className="relative overflow-x-clip pb-20 pt-28 sm:pb-28 sm:pt-32"
    >
      <AmbientBackground />

      {/* Floating orbit cards */}
      <FloatingCard
        className="left-[4%] top-[22%] hidden xl:block"
        delay={0.2}
        rotate={-6}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
          Readmission risk
        </p>
        <p className="mt-1 text-2xl font-bold text-[#0F172A]">12%</p>
        <p className="text-[11px] font-medium text-[#16A34A]">↓ 4% this week</p>
      </FloatingCard>

      <FloatingCard
        className="right-[5%] top-[20%] hidden xl:block"
        delay={0.35}
        rotate={5}
      >
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-[#14B8A6]" />
          <p className="text-xs font-bold text-[#0F172A]">Medicine due</p>
        </div>
        <p className="mt-1 text-[11px] text-[#64748B]">Metformin · 8:00 PM</p>
      </FloatingCard>

      <FloatingCard
        className="bottom-[18%] left-[8%] hidden lg:block"
        delay={0.45}
        rotate={-3}
      >
        <div className="flex items-center gap-2">
          <BellRing className="h-4 w-4 text-[#EF4444]" />
          <p className="text-xs font-bold text-[#0F172A]">Doctor alert</p>
        </div>
        <p className="mt-1 text-[11px] text-[#64748B]">Escalate Asha · high risk</p>
      </FloatingCard>

      <FloatingCard
        className="bottom-[16%] right-[7%] hidden lg:block"
        delay={0.55}
        rotate={4}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#2563EB]">
          Recovery score
        </p>
        <p className="mt-1 text-3xl font-bold text-[#0F172A]">86</p>
      </FloatingCard>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-4 text-center sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-sm font-bold tracking-[0.2em] text-[#2563EB] sm:text-base"
        >
          HEALNEXUS
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#2563EB]/15 bg-white/80 px-4 py-1.5 text-[13px] font-semibold text-[#2563EB] shadow-sm backdrop-blur"
        >
          <Sparkles className="h-3.5 w-3.5" />
          AI-Powered Continuity of Care
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.6 }}
          className="font-display mt-7 max-w-[14ch] text-[2.75rem] font-bold leading-[1.05] tracking-[-0.035em] text-[#0F172A] sm:max-w-[18ch] sm:text-6xl lg:text-[4.75rem]"
        >
          Healthcare doesn&apos;t end at discharge.
          <br />
          <span className="hn-gradient-text">It continues with AI.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-6 max-w-2xl text-base leading-relaxed text-[#64748B] sm:text-lg"
        >
          From hospital ward to living room — one care graph connecting doctors,
          patients, caregivers, and AI that assists without ever replacing clinical
          judgement.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to={primaryHref}
            className="group inline-flex h-12 items-center gap-2 overflow-hidden rounded-2xl bg-[#2563EB] px-7 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(37,99,235,0.35)] transition hover:bg-[#1D4ED8]"
          >
            {primaryLabel}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#how-it-works"
            className="inline-flex h-12 items-center rounded-2xl border border-[#0F172A]/10 bg-white/80 px-7 text-sm font-semibold text-[#0F172A] shadow-sm backdrop-blur transition hover:border-[#2563EB]/30"
          >
            Watch the journey
          </a>
        </motion.div>

        {/* Storytelling path in first fold */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42, duration: 0.65 }}
          className="relative mt-14 w-full max-w-4xl"
        >
          <svg
            className="pointer-events-none absolute left-[8%] right-[8%] top-6 hidden h-8 w-[84%] sm:block"
            viewBox="0 0 800 32"
            fill="none"
            aria-hidden
          >
            <motion.path
              d="M0 16 C120 16 160 4 280 16 C400 28 440 4 560 16 C680 28 720 16 800 16"
              stroke="url(#hnJourney)"
              strokeWidth="2"
              strokeDasharray="6 6"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay: 0.6, duration: 1.4, ease: "easeInOut" }}
            />
            <defs>
              <linearGradient id="hnJourney" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="50%" stopColor="#14B8A6" />
                <stop offset="100%" stopColor="#22C55E" />
              </linearGradient>
            </defs>
          </svg>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-2">
            {JOURNEY.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                  className="hn-glass flex flex-col items-center rounded-2xl px-2 py-3"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] text-white shadow-md">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-2 text-[11px] font-bold text-[#0F172A]">
                    {step.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] font-medium text-[#475569]"
        >
          {["AI Powered", "ABDM Compatible", "PM-JAY Ready", "Offline Support"].map(
            (item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                {item}
              </li>
            ),
          )}
        </motion.ul>
      </div>
    </section>
  );
}

function FloatingCard({
  children,
  className,
  delay,
  rotate,
}: {
  children: ReactNode;
  className?: string;
  delay: number;
  rotate: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotate }}
      animate={{ opacity: 1, y: [0, -8, 0], rotate }}
      transition={{
        opacity: { delay, duration: 0.5 },
        y: { delay: delay + 0.5, duration: 5, repeat: Infinity, ease: "easeInOut" },
      }}
      className={`hn-card-premium absolute z-10 w-[170px] rounded-2xl p-3.5 ${className ?? ""}`}
    >
      {children}
    </motion.div>
  );
}

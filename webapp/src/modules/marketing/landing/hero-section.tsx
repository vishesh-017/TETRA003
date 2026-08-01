import { motion } from "framer-motion";
import { ArrowRight, Check, Play, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import { AmbientBackground } from "@/modules/marketing/landing/ambient-background";
import { HeroDashboard } from "@/modules/marketing/landing/hero-dashboard";
import { roleHomePath } from "@/services/auth.service";

const TRUST = [
  "AI Powered",
  "ABDM Compatible",
  "PM-JAY Ready",
  "Offline Support",
];

export function LandingHero() {
  const { isAuthenticated, user } = useAuth();
  const primaryHref =
    isAuthenticated && user ? roleHomePath(user.role) : "/signup";
  const primaryLabel =
    isAuthenticated && user ? "Open dashboard" : "Get Started";

  return (
    <section
      id="home"
      className="relative overflow-x-clip pb-16 pt-28 sm:pb-24 sm:pt-32"
    >
      <AmbientBackground />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10 xl:gap-14">
        <div className="min-w-0">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl font-bold tracking-tight text-[#0F172A] sm:text-3xl"
          >
            HealNexus
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-1 text-sm font-medium text-[#64748B]"
          >
            AI-Powered Continuity of Care Platform
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#2563EB]/15 bg-white/80 px-3.5 py-1.5 text-[13px] font-semibold text-[#2563EB] shadow-sm backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Powered Continuity of Care
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.55 }}
            className="font-display mt-6 max-w-[18ch] text-[2.75rem] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F172A] sm:text-6xl lg:text-[4.5rem]"
          >
            Healthcare doesn&apos;t end at discharge.
            <br />
            <span className="hn-gradient-text">It continues with AI.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-[#64748B] sm:text-lg"
          >
            Unify discharge, recovery plans, daily monitoring, and clinical
            alerts into one platform — so doctors stay in control and patients
            never fall through the cracks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              to={primaryHref}
              className="group relative inline-flex h-12 items-center gap-2 overflow-hidden rounded-2xl bg-[#2563EB] px-6 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition hover:bg-[#1D4ED8]"
            >
              <span className="absolute inset-0 -translate-x-full bg-white/20 transition duration-500 group-hover:translate-x-full" />
              {primaryLabel}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[#0F172A]/10 bg-white/80 px-6 text-sm font-semibold text-[#0F172A] shadow-sm backdrop-blur transition hover:border-[#2563EB]/30 hover:text-[#2563EB]"
            >
              <Play className="h-4 w-4 fill-current" />
              Watch Live
            </a>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex flex-wrap gap-x-4 gap-y-2"
          >
            {TRUST.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#475569]"
              >
                <Check className="h-3.5 w-3.5 text-[#22C55E]" strokeWidth={2.5} />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        <HeroDashboard />
      </div>
    </section>
  );
}

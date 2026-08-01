import { motion } from "framer-motion";
import { Link, Outlet } from "react-router-dom";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { HealNexusLogo } from "@/components/brand/logo";

export function AuthLayout() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#FAFCFF]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_15%_-10%,rgba(37,99,235,0.16),transparent_55%),radial-gradient(ellipse_55%_45%_at_90%_10%,rgba(20,184,166,0.12),transparent_50%),radial-gradient(ellipse_40%_35%_at_50%_100%,rgba(34,197,94,0.08),transparent_55%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15,23,42,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 30%, black 20%, transparent 75%)",
        }}
      />

      <div className="relative mx-auto flex max-w-6xl items-center justify-end px-4 pt-6">
        <LanguageSwitcher />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100dvh-4rem)] max-w-6xl items-center gap-12 px-4 py-8 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden lg:block"
        >
          <Link to="/">
            <HealNexusLogo showTagline />
          </Link>
          <h1 className="mt-8 font-display text-5xl font-bold tracking-tight text-[#0F172A]">
            Continuity of care,{" "}
            <span className="bg-gradient-to-r from-[#2563EB] to-[#14B8A6] bg-clip-text text-transparent">
              beautifully clear.
            </span>
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-[#64748B]">
            AI-Powered Continuity of Care Platform — doctors stay in control,
            patients never fall through the cracks.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-[#334155]">
            {[
              "Doctor-controlled post-discharge intelligence",
              "AI Care Companion educates & monitors — never diagnoses",
              "Built for hospitals, homes, and rural health workers",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#14B8A6]" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="mb-6 lg:hidden">
            <Link to="/">
              <HealNexusLogo showTagline />
            </Link>
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}

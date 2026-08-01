import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";

import { HealNexusLogo } from "@/components/brand/logo";

export function AuthLayout() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,hsl(211_90%_42%/0.14),transparent_38%),radial-gradient(circle_at_82%_8%,hsl(160_55%_36%/0.12),transparent_32%),linear-gradient(180deg,hsl(210_40%_98%),hsl(214_32%_96%))] dark:bg-[radial-gradient(circle_at_18%_18%,hsl(211_90%_58%/0.16),transparent_38%),radial-gradient(circle_at_82%_8%,hsl(160_50%_42%/0.1),transparent_32%),linear-gradient(180deg,hsl(222_47%_7%),hsl(222_40%_9%))]" />

      <div className="relative mx-auto grid min-h-dvh max-w-6xl items-center gap-12 px-4 py-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden lg:block"
        >
          <HealNexusLogo showTagline />
          <h1 className="mt-8 font-display text-5xl font-semibold tracking-tight text-foreground">
            Continuity of care,{" "}
            <span className="text-primary">beautifully clear.</span>
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
            Connecting Patients, Doctors &amp; AI Beyond Hospital Walls.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-foreground/85">
            {[
              "Doctor-controlled post-discharge intelligence",
              "AI Care Companion educates & monitors — never diagnoses",
              "Built for hospitals, homes, and rural health workers",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
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
            <HealNexusLogo showTagline />
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";

import { env } from "@/config/env";

export function AuthLayout() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,hsl(211_82%_42%/0.16),transparent_36%),radial-gradient(circle_at_80%_0%,hsl(152_48%_40%/0.14),transparent_30%),linear-gradient(180deg,hsl(210_40%_98%),hsl(210_40%_96%))] dark:bg-[radial-gradient(circle_at_20%_20%,hsl(211_90%_58%/0.18),transparent_36%),radial-gradient(circle_at_80%_0%,hsl(152_45%_42%/0.12),transparent_30%),linear-gradient(180deg,hsl(222_40%_8%),hsl(222_34%_10%))]" />

      <div className="relative mx-auto grid min-h-dvh max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="hidden lg:block"
        >
          <p className="font-display text-5xl font-semibold tracking-tight text-primary">
            {env.appName}
          </p>
          <p className="mt-4 max-w-md text-lg text-muted-foreground">
            Connecting Patients, Doctors &amp; AI Beyond Hospital Walls.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-foreground/80">
            <li>Doctor-controlled continuity of care</li>
            <li>
              AI Care Companion organizes, educates, and monitors — never
              diagnoses or prescribes
            </li>
            <li>Built for hospitals, homes, and rural health workers</li>
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}

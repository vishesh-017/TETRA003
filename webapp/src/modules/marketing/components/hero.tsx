import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";

import { HealNexusLogo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { DashboardMockup } from "@/modules/marketing/components/dashboard-mockup";
import { Scene3D } from "@/modules/marketing/components/scene-3d";
import { roleHomePath } from "@/services/auth.service";

export function HeroSection() {
  const { isAuthenticated, user } = useAuth();
  const primaryHref =
    isAuthenticated && user ? roleHomePath(user.role) : "/signup";
  const primaryLabel =
    isAuthenticated && user ? "Open dashboard" : "Get Started";

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-x-clip pt-28">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_10%_-20%,hsl(211_90%_42%/0.18),transparent_55%),radial-gradient(ellipse_70%_50%_at_95%_15%,hsl(174_70%_40%/0.12),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <Scene3D />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 pt-4 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14 lg:pb-24">
        <div className="min-w-0 max-w-xl">
          {/* Single brand lockup — logo.png already includes the wordmark */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-fit"
          >
            <HealNexusLogo size="hero" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="mt-7 font-display text-4xl font-semibold tracking-tight text-balance text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]"
          >
            Smarter Continuity of Care,{" "}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Powered by AI.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Post-discharge intelligence that connects patients, doctors,
            caregivers, and rural health workers — with AI that assists, never
            replaces clinical judgement.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              to={primaryHref}
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              {primaryLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2",
              )}
            >
              <Play className="h-4 w-4" />
              How it works
            </a>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.32 }}
            className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted-foreground"
          >
            {[
              "Hospitals",
              "Home care",
              "Rural outreach",
              "Clinician-controlled",
            ].map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        <div className="relative hidden min-w-0 lg:block">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}

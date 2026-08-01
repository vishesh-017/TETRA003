import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { DashboardMockup } from "@/modules/marketing/components/dashboard-mockup";
import { roleHomePath } from "@/services/auth.service";

export function HeroSection() {
  const { isAuthenticated, user } = useAuth();
  const primaryHref =
    isAuthenticated && user ? roleHomePath(user.role) : "/signup";
  const primaryLabel =
    isAuthenticated && user ? "Open dashboard" : "Get Started";

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_10%_-10%,hsl(211_90%_42%/0.18),transparent_55%),radial-gradient(ellipse_70%_50%_at_90%_0%,hsl(160_55%_36%/0.14),transparent_50%)]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-16">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl font-semibold tracking-tight text-primary sm:text-3xl"
          >
            HealNexus
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-3 max-w-xl font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.35rem] lg:leading-[1.1]"
          >
            Smarter Continuity of Care,{" "}
            <span className="text-primary">Powered by AI.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            Post-discharge intelligence that connects patients, doctors,
            caregivers, and rural health workers — with AI that assists, never
            replaces clinical judgement.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-7 flex flex-wrap gap-3"
          >
            <Link to={primaryHref} className={cn(buttonVariants({ size: "lg" }))}>
              {primaryLabel}
            </Link>
            <a
              href="#how-it-works"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "gap-2",
              )}
            >
              <Play className="h-4 w-4" />
              Watch Demo
            </a>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-5 text-xs text-muted-foreground"
          >
            Built for hospitals · clinics · home care · rural outreach
          </motion.p>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}

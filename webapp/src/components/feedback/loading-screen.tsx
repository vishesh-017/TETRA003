import { motion, useReducedMotion } from "framer-motion";

import { HealNexusMark } from "@/components/brand/logo";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  label?: string;
  className?: string;
  fullScreen?: boolean;
  /** Prefer skeletons for in-page loads */
  variant?: "brand" | "skeleton";
}

export function LoadingScreen({
  label = "Loading HealNexus…",
  className,
  fullScreen = true,
  variant = "brand",
}: LoadingScreenProps) {
  const reduce = useReducedMotion();

  if (variant === "skeleton" && !fullScreen) {
    return (
      <div className={cn("space-y-4", className)}>
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen ? "min-h-dvh" : "min-h-48",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={
            reduce
              ? undefined
              : { scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }
          }
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <HealNexusMark size={48} />
        </motion.div>
        <div className="h-1.5 w-36 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary to-secondary"
            animate={reduce ? undefined : { x: ["-100%", "200%"] }}
            transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

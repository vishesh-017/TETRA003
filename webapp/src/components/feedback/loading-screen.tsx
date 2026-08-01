import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  label?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({
  label = "Loading HealNexus…",
  className,
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullScreen ? "min-h-dvh" : "min-h-48",
        className,
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="h-12 w-12 rounded-2xl bg-primary/15"
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full w-1/2 rounded-full bg-primary"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

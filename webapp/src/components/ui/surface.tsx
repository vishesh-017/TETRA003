import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

/** Premium elevated panel — preferred over ad-hoc rounded-3xl cards. */
export function Surface({
  className,
  interactive = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/80 bg-card/80 shadow-soft backdrop-blur-md",
        interactive && "interactive-lift cursor-pointer",
        className,
      )}
      {...props}
    />
  );
}

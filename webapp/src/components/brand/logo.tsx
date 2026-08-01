import { cn } from "@/lib/utils";

const LOGO_SRC = "/logo.png";

/** Square crop of the official mark — for collapsed sidebar / compact chrome. */
export function HealNexusMark({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <img
      src={LOGO_SRC}
      alt=""
      width={size}
      height={size}
      className={cn(
        "shrink-0 rounded-xl object-cover object-[center_18%] shadow-soft",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

export function HealNexusLogo({
  className,
  showTagline = false,
  compact = false,
  size = "default",
}: {
  className?: string;
  showTagline?: boolean;
  compact?: boolean;
  /** default = nav wordmark; hero = large lockup; compact = icon only */
  size?: "default" | "hero" | "compact";
}) {
  const mode = compact ? "compact" : size;

  if (mode === "compact") {
    return (
      <HealNexusMark size={36} className={className} />
    );
  }

  if (mode === "hero") {
    return (
      <img
        src={LOGO_SRC}
        alt="HealNexus — Connecting Care. Empowering Health."
        className={cn(
          "block h-auto w-[240px] max-w-full rounded-2xl object-contain shadow-lift ring-1 ring-white/10 sm:w-[300px]",
          className,
        )}
      />
    );
  }

  return (
    <img
      src={LOGO_SRC}
      alt="HealNexus"
      className={cn(
        "h-11 w-auto max-w-[190px] rounded-xl object-contain object-left shadow-soft ring-1 ring-border/40",
        className,
      )}
      title={showTagline ? "Connecting Care. Empowering Health." : undefined}
    />
  );
}

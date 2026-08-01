import { cn } from "@/lib/utils";

export function HealNexusMark({
  className,
  size = 36,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect width="64" height="64" rx="16" className="fill-primary" />
      <path
        d="M32 14c-1.2 0-2.2.7-2.7 1.8l-3.4 8.1a3 3 0 0 1-2.1 1.8l-8.7 1.8c-2.5.5-3.5 3.5-1.8 5.3l6.5 6.7a3 3 0 0 1 .8 2.5l-1.3 8.8c-.4 2.6 2.2 4.5 4.5 3.3L32 50.7l7.9 4.4c2.3 1.2 4.9-.7 4.5-3.3l-1.3-8.8a3 3 0 0 1 .8-2.5l6.5-6.7c1.7-1.8.7-4.8-1.8-5.3l-8.7-1.8a3 3 0 0 1-2.1-1.8l-3.4-8.1C34.2 14.7 33.2 14 32 14Z"
        fill="white"
      />
      <path
        d="M32 24.5v15M24.5 32H39.5"
        className="stroke-secondary"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function HealNexusLogo({
  className,
  showTagline = false,
  compact = false,
}: {
  className?: string;
  showTagline?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <HealNexusMark size={compact ? 28 : 36} />
      {!compact ? (
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold leading-none tracking-tight text-primary">
            HealNexus
          </p>
          {showTagline ? (
            <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
              Beyond hospital walls
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

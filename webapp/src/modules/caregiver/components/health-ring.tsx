import { motion, useMotionValueEvent, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { statusTone } from "@/modules/caregiver/lib";
import type { FamilyMember } from "@/modules/caregiver/types";

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 80, damping: 18 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useMotionValueEvent(spring, "change", (latest) => {
    setDisplay(Math.round(latest));
  });

  return <span className="tabular-nums">{display}</span>;
}

export function HealthRing({
  member,
  className,
}: {
  member: FamilyMember;
  className?: string;
}) {
  const tone = statusTone(member.status);
  const size = 188;
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, member.recoveryScore)) / 100;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
          tone.glow,
        )}
      />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Live Health Status
        </p>
        <p className="mt-1 font-display text-2xl font-semibold tracking-tight">
          {member.name.split(" ")[0]}
        </p>

        <div className="mt-4 flex flex-col items-center">
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="rgba(148,163,184,0.25)"
                strokeWidth={stroke}
              />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={tone.ring}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: circumference * (1 - progress) }}
                transition={{ type: "spring", stiffness: 60, damping: 18 }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Recovery
                </p>
                <p className="font-display text-5xl font-semibold tabular-nums leading-none">
                  <AnimatedNumber value={member.recoveryScore} />
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid w-full grid-cols-3 gap-2 text-center">
            <Stat label="Status" value={member.statusLabel} />
            <Stat label="Medicine" value={`${member.medicineAdherence}%`} />
            <Stat label="Trend" value={member.trendLabel} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50/90 px-2 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

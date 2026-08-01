import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import { statusTone, vitalGlyph } from "@/modules/caregiver/lib";
import type { FamilyMember } from "@/modules/caregiver/types";

export function FamilyCard({
  member,
  active,
  onSelect,
}: {
  member: FamilyMember;
  active?: boolean;
  onSelect?: () => void;
}) {
  const tone = statusTone(member.status);

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onSelect}
      className={cn(
        "relative w-full overflow-hidden rounded-[1.75rem] border p-5 text-left shadow-soft transition",
        active
          ? "border-primary/25 bg-white ring-2 ring-primary/15"
          : "border-white/70 bg-white/80 hover:bg-white",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-gradient-to-br blur-2xl",
          tone.glow,
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-slate-50 to-sky-50 text-3xl shadow-inner">
            {member.avatarEmoji}
          </span>
          <div>
            <h3 className="font-display text-xl font-semibold tracking-tight">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.relationship}</p>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1",
            tone.chip,
          )}
        >
          {member.statusLabel}
        </span>
      </div>

      <div className="relative mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Recovery Score
          </p>
          <p className="mt-1 font-display text-4xl font-semibold tabular-nums tracking-tight">
            {member.recoveryScore}
          </p>
        </div>
        <div className="min-w-[140px] flex-1">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Today&apos;s Progress</span>
            <span className="tabular-nums">{member.todayProgress}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${member.todayProgress}%` }}
              transition={{ type: "spring", stiffness: 90, damping: 18 }}
            />
          </div>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-2">
        {member.vitals.map((v) => (
          <div
            key={v.label}
            className={cn(
              "rounded-xl px-2.5 py-2 text-center text-xs font-medium",
              v.status === "ok" && "bg-emerald-50 text-emerald-800",
              v.status === "pending" && "bg-amber-50 text-amber-900",
              v.status === "alert" && "bg-rose-50 text-rose-800",
            )}
          >
            <span className="mr-1 opacity-80">{vitalGlyph(v.status)}</span>
            {v.label}
          </div>
        ))}
      </div>

      <p className="relative mt-4 text-sm text-muted-foreground">
        Next appointment ·{" "}
        <span className="font-semibold text-foreground">{member.nextAppointment}</span>
      </p>
    </motion.button>
  );
}

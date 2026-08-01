import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/modules/caregiver/types";

const toneDot = {
  ok: "bg-emerald-500",
  info: "bg-sky-500",
  alert: "bg-rose-500",
} as const;

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Recent Activity
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          What happened today
        </h2>
      </div>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex gap-3 rounded-2xl bg-slate-50/90 px-3 py-3"
          >
            <span
              className={cn(
                "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                toneDot[item.tone],
              )}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">{item.title}</p>
                <time className="text-xs tabular-nums text-muted-foreground">
                  {item.timestamp}
                </time>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}

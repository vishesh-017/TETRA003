import { motion } from "framer-motion";
import { Check, Clock3, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import { timelineIconState } from "@/modules/caregiver/lib";
import type { CareTimelineItem } from "@/modules/caregiver/types";

export function CareTimeline({
  items,
  title = "Today's Care",
}: {
  items: CareTimelineItem[];
  title?: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Care rhythm
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">{title}</h2>
      </div>

      {!items.length ? (
        <p className="text-sm text-muted-foreground">
          Today&apos;s checklist will appear from the approved care plan, medicines,
          and check-in status.
        </p>
      ) : null}

      <ol className="relative space-y-0">
        <span className="absolute bottom-3 left-[19px] top-3 w-px bg-gradient-to-b from-sky-300 via-teal-200 to-transparent" />
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.06 }}
            className="relative flex gap-4 pb-5 last:pb-0"
          >
            <span
              className={cn(
                "relative z-10 mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-full shadow-sm",
                timelineIconState(item.state),
              )}
            >
              {item.state === "done" ? (
                <Check className="h-4 w-4" />
              ) : item.state === "warning" ? (
                <TriangleAlert className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}
            </span>
            <div className="min-w-0 flex-1 rounded-2xl bg-slate-50/80 px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <time className="text-xs font-medium tabular-nums text-muted-foreground">
                  {item.time}
                </time>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

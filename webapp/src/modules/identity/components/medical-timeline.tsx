import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  FlaskConical,
  Hospital,
  Pill,
  Stethoscope,
  Syringe,
} from "lucide-react";

import { SectionLabel } from "@/modules/identity/components/glass-panel";
import type { TimelineEvent } from "@/modules/identity/types";

const ICONS = {
  admission: Hospital,
  discharge: Stethoscope,
  medicine: Pill,
  checkin: ClipboardList,
  appointment: CalendarDays,
  report: FileText,
  vaccination: Syringe,
  note: FileText,
  investigation: FlaskConical,
};

export function MedicalTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <section className="glass-panel rounded-3xl p-5 sm:p-6">
      <SectionLabel>Medical history timeline</SectionLabel>
      <p className="mt-1 text-sm text-muted-foreground">
        Your care journey — admissions to daily check-ins.
      </p>

      <div className="relative mt-6 space-y-0">
        <div className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-primary/50 via-border to-transparent" />
        {events.map((event, index) => {
          const Icon = ICONS[event.kind];
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.4) }}
              className="relative flex gap-4 pb-6 last:pb-0"
            >
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-background text-primary shadow-soft">
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-background/50 px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium capitalize">{event.title}</p>
                  <time className="text-xs text-muted-foreground">
                    {format(new Date(event.at), "dd MMM yyyy")}
                  </time>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {event.summary}
                </p>
                {event.meta ? (
                  <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground/80">
                    {event.meta}
                  </p>
                ) : null}
              </div>
            </motion.div>
          );
        })}
        {!events.length ? (
          <p className="pl-12 text-sm text-muted-foreground">
            Timeline will fill as care events are recorded.
          </p>
        ) : null}
      </div>
    </section>
  );
}

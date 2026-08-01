import { motion } from "framer-motion";
import { CalendarClock, MapPinned, Route } from "lucide-react";
import { Link } from "react-router-dom";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCaregiver } from "@/modules/caregiver/context";
import type { CareAppointment } from "@/modules/caregiver/types";

export function AppointmentSpotlight({
  appointments,
}: {
  appointments: CareAppointment[];
}) {
  const { selected, appointmentAction } = useCaregiver();
  const appt = appointments[0];
  if (!appt) {
    return (
      <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 text-sm text-muted-foreground shadow-soft">
        No upcoming appointments scheduled for {selected.name.split(" ")[0]}.
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[1.75rem] border border-sky-100 bg-gradient-to-br from-[#0B3B5A] via-[#0E4F6E] to-[#0F766E] p-5 text-white shadow-lift sm:p-6"
    >
      <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
            Next Appointment
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            {appt.whenLabel}
          </h2>
          <p className="mt-1 text-lg font-medium text-teal-100">{appt.time}</p>
          <p className="mt-3 text-sm text-white/80">{appt.countdown}</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur">
          <CalendarClock className="h-3.5 w-3.5" />
          {appt.specialty}
        </span>
      </div>

      <div className="relative mt-5 space-y-1 text-sm">
        <p className="font-semibold">{appt.doctorName}</p>
        <p className="text-white/80">{appt.hospital}</p>
        <p className="flex items-center gap-1.5 text-white/70">
          <MapPinned className="h-3.5 w-3.5" />
          {appt.address}
        </p>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appt.mapQuery)}`}
          target="_blank"
          rel="noreferrer"
          className={cn(
            buttonVariants({ size: "sm" }),
            "border-0 bg-white text-slate-900 hover:bg-white/90",
          )}
        >
          <Route className="mr-1.5 h-3.5 w-3.5" />
          Directions
        </a>
        <Link
          to="/maps"
          className={cn(
            buttonVariants({ size: "sm", variant: "secondary" }),
            "border-0 bg-white/15 text-white hover:bg-white/25",
          )}
        >
          Map
        </Link>
        <Button
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/10 hover:text-white"
          disabled={appointmentAction.isPending}
          onClick={() =>
            appointmentAction.mutate({
              patientUserId: selected.userId,
              appointmentId: appt.id,
              action: "reschedule",
            })
          }
        >
          Reschedule
        </Button>
      </div>
    </motion.section>
  );
}

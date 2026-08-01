import { motion } from "framer-motion";

import { AppointmentSpotlight } from "@/modules/caregiver/components/appointment-spotlight";
import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { useCaregiver } from "@/modules/caregiver/context";

export function CaregiverAppointmentsPage() {
  const { selected, appointments, family } = useCaregiver();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Appointments
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Upcoming visits
        </h1>
        <p className="mt-2 text-muted-foreground">
          Countdown, directions, and reschedule — focused on {selected.name}.
        </p>
      </motion.div>
      <FamilySwitcher />
      <AppointmentSpotlight appointments={appointments} />

      <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft">
        <h2 className="font-display text-xl font-semibold">Family schedule</h2>
        <ul className="mt-4 space-y-3">
          {family.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm"
            >
              <span className="font-semibold">
                {m.avatarEmoji} {m.name}
              </span>
              <span className="text-muted-foreground">{m.nextAppointment}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

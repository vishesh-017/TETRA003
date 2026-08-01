import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Pill,
  Stethoscope,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CaregiverCarePlanSupport } from "@/modules/caregiver/types";

export function CarePlanBrief({ plan }: { plan: CaregiverCarePlanSupport | null }) {
  if (!plan) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          No approved AI Care Companion plan yet. It appears here after the doctor
          finalizes discharge and publishes the recovery plan.
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div>
        <p className="text-sm font-medium text-teal-800">AI Care Companion</p>
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Care instructions for today
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Organized from the doctor&apos;s approved discharge plan · v{plan.version}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50/80 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <HeartPulse className="h-4 w-4 text-teal-700" />
              Caregiver instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {plan.instructions.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-amber-100 bg-gradient-to-br from-amber-50/70 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Warning signs to monitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
              {plan.warningSigns.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {plan.emergencyAdvice ? (
              <p className="mt-3 rounded-xl bg-amber-100/60 px-3 py-2 text-sm text-amber-950">
                {plan.emergencyAdvice}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Pill className="h-4 w-4 text-primary" />
              Medicine timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {plan.medicineTimeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No medicines listed.</p>
            ) : (
              plan.medicineTimeline.map((med) => (
                <div
                  key={med}
                  className="rounded-xl border border-border/80 px-3 py-2 text-sm"
                >
                  {med}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Stethoscope className="h-4 w-4 text-primary" />
              Doctor notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p className="whitespace-pre-wrap">{plan.doctorNotes || "—"}</p>
            {plan.upcomingAppointment ? (
              <p className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-foreground ring-1 ring-border/70">
                <CalendarDays className="h-4 w-4 text-primary" />
                Upcoming: {plan.upcomingAppointment}
              </p>
            ) : null}
            {plan.nextSteps.length ? (
              <div>
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/70">
                  <ClipboardList className="h-3.5 w-3.5" />
                  Next steps
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  {plan.nextSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </motion.section>
  );
}

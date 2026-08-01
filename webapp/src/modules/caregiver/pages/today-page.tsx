import { motion } from "framer-motion";

import { CareTimeline } from "@/modules/caregiver/components/care-timeline";
import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { CaregiverInvestigationStatus } from "@/modules/caregiver/components/investigation-status";
import { SmartAlerts } from "@/modules/caregiver/components/smart-alerts";
import { useCaregiver } from "@/modules/caregiver/context";

export function CaregiverTodayPage() {
  const { selected, timeline, alerts } = useCaregiver();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Today&apos;s Care
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {selected.name.split(" ")[0]}&apos;s day
        </h1>
        <p className="mt-2 text-muted-foreground">
          Medicines, vitals, walks, and investigation reminders — so you always
          know what comes next.
        </p>
      </motion.div>
      <FamilySwitcher />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <CareTimeline items={timeline} title="Care timeline" />
        <div className="space-y-5">
          <SmartAlerts alerts={alerts} title="Needs attention" />
          <CaregiverInvestigationStatus
            patientId={selected.id}
            patientName={selected.name}
          />
        </div>
      </div>
    </div>
  );
}

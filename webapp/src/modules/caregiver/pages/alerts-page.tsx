import { motion } from "framer-motion";

import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { SmartAlerts } from "@/modules/caregiver/components/smart-alerts";
import { useCaregiver } from "@/modules/caregiver/context";

export function CaregiverAlertsPage() {
  const { alerts, allAlerts, selected } = useCaregiver();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Alerts
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          What needs you
        </h1>
        <p className="mt-2 text-muted-foreground">
          Prioritized for {selected.name}, with a household view below.
        </p>
      </motion.div>
      <FamilySwitcher />
      <SmartAlerts alerts={alerts} title={`${selected.name.split(" ")[0]}'s alerts`} />
      <SmartAlerts alerts={allAlerts} title="Entire household" />
    </div>
  );
}

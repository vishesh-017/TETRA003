import { motion } from "framer-motion";

import { EmergencyPanel } from "@/modules/caregiver/components/emergency-panel";
import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { SmartAlerts } from "@/modules/caregiver/components/smart-alerts";
import { useCaregiver } from "@/modules/caregiver/context";

export function CaregiverEmergencyPage() {
  const { selected, alerts } = useCaregiver();
  const urgent = alerts.filter(
    (a) => a.priority === "critical" || a.priority === "high",
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700/80">
          Emergency
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Stay calm. Act clearly.
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Large, touch-friendly actions for {selected.name}. Call the doctor, start a
          video consult, or reach ambulance services without digging through menus.
        </p>
      </motion.div>
      <FamilySwitcher />
      <EmergencyPanel />
      {urgent.length ? (
        <SmartAlerts alerts={urgent} title="Urgent for this person" />
      ) : null}
    </div>
  );
}

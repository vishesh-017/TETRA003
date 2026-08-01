import { motion } from "framer-motion";

import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { MedicineSchedule } from "@/modules/caregiver/components/medicine-schedule";
import { useCaregiver } from "@/modules/caregiver/context";

export function CaregiverMedicinesPage() {
  const { selected, medicines } = useCaregiver();
  const adherence = selected.medicineAdherence;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Medicines
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Medicine rhythm for {selected.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Adherence this week:{" "}
          <span className="font-semibold text-foreground">{adherence}%</span>
        </p>
      </motion.div>
      <FamilySwitcher />
      <MedicineSchedule medicines={medicines} />
    </div>
  );
}

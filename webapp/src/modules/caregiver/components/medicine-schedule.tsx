import { motion } from "framer-motion";
import { Pill } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { medicineStateClass, medicineStateLabel } from "@/modules/caregiver/lib";
import type { MedicineDose, MedicineSlot } from "@/modules/caregiver/types";

const SLOTS: MedicineSlot[] = ["morning", "afternoon", "evening", "night"];
const SLOT_LABEL: Record<MedicineSlot, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  night: "Night",
};

export function MedicineSchedule({ medicines }: { medicines: MedicineDose[] }) {
  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur sm:p-6">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Medicine Timeline
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          Doses by time of day
        </h2>
      </div>

      <div className="space-y-5">
        {SLOTS.map((slot) => {
          const doses = medicines.filter((m) => m.slot === slot);
          if (!doses.length) return null;
          return (
            <div key={slot}>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                {SLOT_LABEL[slot]}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {doses.map((dose, i) => (
                  <motion.article
                    key={dose.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex gap-3 rounded-2xl border border-border/70 bg-gradient-to-br from-white to-slate-50/80 p-4"
                  >
                    <span
                      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-soft"
                      style={{ backgroundColor: dose.accent }}
                    >
                      <Pill className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold">{dose.name}</h3>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            medicineStateClass(dose.state),
                          )}
                        >
                          {medicineStateLabel(dose.state)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {dose.dosage} · {dose.instruction}
                      </p>
                      {dose.state === "pending" || dose.state === "missed" ? (
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              toast.success(`${dose.name} marked taken`, {
                                description: "Nice — keeping the routine on track.",
                              })
                            }
                          >
                            Taken
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              toast.message(`${dose.name} skipped`, {
                                description: "Noted for the doctor summary.",
                              })
                            }
                          >
                            Skip
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

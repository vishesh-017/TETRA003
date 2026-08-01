import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { useCaregiver } from "@/modules/caregiver/context";
import { statusTone } from "@/modules/caregiver/lib";

export function FamilySwitcher({ className }: { className?: string }) {
  const { family, selectedId, selectMember } = useCaregiver();

  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-1", className)} role="tablist" aria-label="Family members">
      {family.map((member) => {
        const active = member.id === selectedId;
        const tone = statusTone(member.status);
        return (
          <motion.button
            key={member.id}
            type="button"
            role="tab"
            aria-selected={active}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => selectMember(member.id)}
            className={cn(
              "relative min-w-[148px] shrink-0 rounded-2xl border px-4 py-3 text-left transition-shadow",
              active
                ? "border-primary/30 bg-white shadow-lift ring-2 ring-primary/20"
                : "border-border/80 bg-white/70 shadow-soft hover:bg-white",
            )}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-sky-100 to-teal-50 text-xl">
                {member.avatarEmoji}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{member.shortLabel}</p>
                <p className="text-xs text-muted-foreground">{member.name.split(" ")[0]}</p>
              </div>
            </div>
            <span
              className={cn(
                "mt-3 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
                tone.chip,
              )}
            >
              {member.statusLabel}
            </span>
            <AnimatePresence>
              {active ? (
                <motion.span
                  layoutId="family-active"
                  className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              ) : null}
            </AnimatePresence>
          </motion.button>
        );
      })}

      <button
        type="button"
        onClick={() =>
          toast.message("Ask the patient to invite you", {
            description:
              "Patients add caregivers from Profile → My caregivers. You will receive an invite code for login.",
          })
        }
        className="flex min-w-[132px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-white/40 px-4 py-3 text-muted-foreground transition hover:border-primary/40 hover:bg-white hover:text-foreground"
      >
        <Plus className="h-5 w-5" />
        <span className="text-xs font-semibold">Add Member</span>
      </button>
    </div>
  );
}

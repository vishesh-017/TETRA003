import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FamilyCard } from "@/modules/caregiver/components/family-card";
import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { useCaregiver } from "@/modules/caregiver/context";

export function CaregiverFamilyPage() {
  const { family, selected, selectMember } = useCaregiver();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Family Members
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          People you care for
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Switch between loved ones instantly. Everything on your dashboard updates to
          their care plan, medicines, and alerts.
        </p>
      </motion.div>

      <FamilySwitcher />

      <div className="grid gap-4 lg:grid-cols-2">
        {family.map((member) => (
          <FamilyCard
            key={member.id}
            member={member}
            active={member.id === selected.id}
            onSelect={() => selectMember(member.id)}
          />
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-dashed border-border bg-white/60 p-6 text-center">
        <h2 className="font-display text-xl font-semibold">Invite another family member</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Grandparents, siblings, or anyone you support after discharge can join your
          caregiver circle.
        </p>
        <Button
          className="mt-4"
          onClick={() =>
            toast.message("Patients invite caregivers", {
              description:
                "Ask your loved one to open Patient → Profile → My caregivers and share the invite code with you.",
            })
          }
        >
          How to get invited
        </Button>
      </div>

      <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft">
        <h2 className="font-display text-xl font-semibold">Selected profile</h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
          <Item label="Condition" value={selected.conditionSummary} />
          <Item label="Doctor" value={selected.doctorName} />
          <Item label="Hospital" value={selected.hospital} />
          <Item label="PM-JAY" value={selected.pmjayStatus} />
          <Item label="ABHA" value={selected.abhaId} />
          <Item
            label="Emergency contact"
            value={`${selected.emergencyContact.name} · ${selected.emergencyContact.phone}`}
          />
        </dl>
      </section>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}

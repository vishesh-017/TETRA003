import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useCaregiver } from "@/modules/caregiver/context";

export function CaregiverSettingsPage() {
  const { caregiverName, family } = useCaregiver();
  const { logout, user } = useAuth();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Settings
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Your caregiver preferences
        </h1>
      </motion.div>

      <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft">
        <h2 className="font-semibold">Profile</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Name</dt>
            <dd className="font-medium">{user?.full_name ?? `${caregiverName} Patel`}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{user?.email ?? "caregiver@healnexus.demo"}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Family linked</dt>
            <dd className="font-medium">{family.length} members</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft">
        <h2 className="font-semibold">Notifications</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {[
            "Missed medicine alerts",
            "High sugar / BP alerts",
            "Appointment reminders",
            "Doctor messages",
          ].map((label) => (
            <li
              key={label}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
            >
              <span>{label}</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800">
                On
              </span>
            </li>
          ))}
        </ul>
        <Button
          className="mt-4"
          variant="secondary"
          onClick={() =>
            toast.success("Preferences saved", {
              description: "Demo mode keeps all caregiver alerts enabled.",
            })
          }
        >
          Save preferences
        </Button>
      </section>

      <Button
        variant="outline"
        className="h-11"
        onClick={() => void logout()}
      >
        Sign out
      </Button>
    </div>
  );
}

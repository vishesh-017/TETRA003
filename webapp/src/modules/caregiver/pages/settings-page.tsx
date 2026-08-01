import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useCaregiver } from "@/modules/caregiver/context";
import {
  useCaregiverMutations,
  useCaregiverPrefs,
} from "@/modules/caregiver/hooks";

export function CaregiverSettingsPage() {
  const { caregiverName, family } = useCaregiver();
  const { logout, user } = useAuth();
  const prefsQuery = useCaregiverPrefs();
  const { savePrefs } = useCaregiverMutations();
  const [prefs, setPrefs] = useState({
    medicine: true,
    appointment: true,
    tips: true,
    doctor_messages: true,
  });

  useEffect(() => {
    if (prefsQuery.data) setPrefs(prefsQuery.data);
  }, [prefsQuery.data]);

  const rows: Array<{
    key: keyof typeof prefs;
    label: string;
  }> = [
    { key: "medicine", label: "Missed medicine alerts" },
    { key: "tips", label: "High sugar / BP & health tips" },
    { key: "appointment", label: "Appointment reminders" },
    { key: "doctor_messages", label: "Doctor messages" },
  ];

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
            <dd className="font-medium">
              {user?.full_name ?? caregiverName}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="font-medium">{user?.email ?? "—"}</dd>
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
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
            >
              <span>{row.label}</span>
              <button
                type="button"
                onClick={() =>
                  setPrefs((p) => ({ ...p, [row.key]: !p[row.key] }))
                }
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  prefs[row.key]
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {prefs[row.key] ? "On" : "Off"}
              </button>
            </li>
          ))}
        </ul>
        <Button
          className="mt-4"
          variant="secondary"
          disabled={savePrefs.isPending}
          onClick={() => savePrefs.mutate(prefs)}
        >
          {savePrefs.isPending ? "Saving…" : "Save preferences"}
        </Button>
      </section>

      <Button variant="outline" className="h-11" onClick={() => void logout()}>
        Sign out
      </Button>
    </div>
  );
}

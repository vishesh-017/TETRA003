import { motion } from "framer-motion";
import { Phone, ShieldAlert } from "lucide-react";
import { useParams } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { useEmergencyProfile } from "@/modules/identity/hooks";

/** Public Emergency Medical Profile — opened by QR scan. */
export function EmergencyProfilePage() {
  const { token } = useParams();
  const query = useEmergencyProfile(token);

  if (query.isLoading)
    return <LoadingScreen label="Loading emergency profile…" />;
  if (query.isError || !query.data)
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorState
          title="Profile not found"
          description="This QR token is unknown. Ask the patient to open their HealNexus Passport."
        />
      </div>
    );

  const p = query.data;

  return (
    <div className="min-h-dvh bg-gradient-to-b from-red-50 via-background to-background px-4 py-8 dark:from-red-950/30">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-lg"
      >
        <div className="mb-4 flex items-center gap-2 text-red-700 dark:text-red-300">
          <ShieldAlert className="h-5 w-5" />
          <p className="text-xs font-semibold uppercase tracking-[0.16em]">
            Emergency Medical Profile
          </p>
        </div>

        <div className="overflow-hidden rounded-[1.75rem] border border-red-200 bg-card shadow-soft dark:border-red-900">
          <div className="bg-gradient-to-r from-red-600 to-rose-600 px-5 py-6 text-white">
            <p className="text-sm text-white/80">Patient</p>
            <h1 className="font-display text-3xl font-semibold">{p.full_name}</h1>
            <p className="mt-2 text-4xl font-semibold tracking-tight">
              {p.blood_group || "—"}
              <span className="ml-2 text-base font-normal text-white/80">
                blood group
              </span>
            </p>
          </div>

          <div className="space-y-4 p-5">
            <Block
              label="Allergies"
              value={
                p.allergies.length ? p.allergies.join(", ") : "None recorded"
              }
            />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Current medicines
              </p>
              <ul className="mt-2 space-y-1.5">
                {p.medicines.map((m) => (
                  <li
                    key={m.name}
                    className="rounded-xl border border-border px-3 py-2 text-sm font-medium"
                  >
                    {m.name}
                    {m.dose ? ` · ${m.dose}` : ""}
                  </li>
                ))}
              </ul>
            </div>
            <Block
              label="Emergency contact"
              value={
                p.emergency_contact
                  ? `${p.emergency_contact.name || ""} · ${p.emergency_contact.relationship || ""} · ${p.emergency_contact.phone || ""}`
                  : "—"
              }
            />
            <Block
              label="Doctor contact"
              value={
                p.doctor
                  ? `${p.doctor.name} · ${p.doctor.hospital}${p.doctor.phone ? ` · ${p.doctor.phone}` : ""}`
                  : "—"
              }
            />

            <div className="flex flex-wrap gap-2 pt-2">
              {p.emergency_contact?.phone ? (
                <a
                  href={`tel:${p.emergency_contact.phone}`}
                  className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <Phone className="h-4 w-4" />
                  Call emergency contact
                </a>
              ) : null}
              {p.doctor?.phone ? (
                <a
                  href={`tel:${p.doctor.phone}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium"
                >
                  Call doctor
                </a>
              ) : null}
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              {p.disclaimer}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

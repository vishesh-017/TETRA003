import { motion } from "framer-motion";
import { Phone, Siren } from "lucide-react";

import { AHMEDABAD_DEMO_HOSPITALS } from "@/data/ahmedabad-hospitals";
import type { DigitalPassport } from "@/modules/identity/types";

export function EmergencyCard({ passport }: { passport: DigitalPassport }) {
  const hospital =
    AHMEDABAD_DEMO_HOSPITALS.find((h) => h.is_emergency) ??
    AHMEDABAD_DEMO_HOSPITALS[0]!;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-red-600 via-red-500 to-rose-700 p-5 text-white shadow-soft"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/80">
            <Siren className="h-4 w-4" />
            Emergency Card
          </div>
          <p className="mt-2 font-display text-2xl font-semibold">
            {passport.full_name}
          </p>
          <p className="text-sm text-white/80">One-tap critical information</p>
        </div>
        <div className="rounded-2xl bg-white/15 px-3 py-2 text-center backdrop-blur">
          <p className="text-[10px] uppercase tracking-wider text-white/70">
            Blood
          </p>
          <p className="font-display text-2xl font-semibold">
            {passport.blood_group || "—"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Info
          label="Allergies"
          value={
            passport.allergies.length
              ? passport.allergies.join(", ")
              : "None recorded"
          }
        />
        <Info
          label="Emergency contact"
          value={
            passport.emergency_contact
              ? `${passport.emergency_contact.name || ""} · ${passport.emergency_contact.phone || ""}`
              : "—"
          }
        />
        <Info
          label="Medicines"
          value={
            passport.medicines.length
              ? passport.medicines.map((m) => m.name).join(", ")
              : "—"
          }
        />
        <Info
          label="Doctor"
          value={
            passport.doctor
              ? `${passport.doctor.name}${passport.doctor.phone ? ` · ${passport.doctor.phone}` : ""}`
              : "—"
          }
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {passport.emergency_contact?.phone ? (
          <a
            href={`tel:${passport.emergency_contact.phone}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-red-700"
          >
            <Phone className="h-4 w-4" />
            Call emergency contact
          </a>
        ) : null}
        <a
          href={`tel:${hospital.phone}`}
          className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/30"
        >
          Nearest hospital · {hospital.name}
        </a>
      </div>
    </motion.section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[11px] uppercase tracking-wider text-white/65">{label}</p>
      <p className="mt-1 text-sm font-medium leading-snug">{value}</p>
    </div>
  );
}

import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { PassportQr } from "@/modules/identity/components/passport-qr";
import { SectionLabel } from "@/modules/identity/components/glass-panel";
import type { DigitalPassport } from "@/modules/identity/types";

export function PassportWallet({ passport }: { passport: DigitalPassport }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className="relative overflow-hidden rounded-[1.85rem] wallet-shine p-1 shadow-soft"
    >
      <div className="rounded-[1.7rem] bg-gradient-to-b from-white/15 to-transparent p-5 text-white sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
              <ShieldCheck className="h-3.5 w-3.5" />
              HealNexus Passport
            </div>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {passport.full_name}
            </h2>
            <p className="mt-1 text-sm text-white/80">
              {[
                passport.age != null ? `${passport.age} yrs` : null,
                passport.sex,
                passport.address_city,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-xl font-semibold backdrop-blur sm:h-20 sm:w-20 sm:text-2xl">
            {passport.photo_initials}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Blood group" value={passport.blood_group || "—"} />
            <Stat label="ABHA (Demo)" value={passport.abha_id_demo || "—"} mono />
            <Stat
              label="Recovery"
              value={
                passport.recovery_score != null
                  ? `${passport.recovery_score.toFixed(0)}`
                  : "—"
              }
            />
            <Stat
              label="Readmission"
              value={passport.readmission_risk || "—"}
              capitalize
            />
            <Stat
              label="Emergency"
              value={passport.emergency_status}
              capitalize
            />
            <Stat
              label="Last check-in"
              value={
                passport.last_checkin_at
                  ? formatDistanceToNow(new Date(passport.last_checkin_at), {
                      addSuffix: true,
                    })
                  : "—"
              }
            />
          </div>
          <PassportQr token={passport.qr_token} size={120} className="mx-auto" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {passport.conditions.map((c) => (
            <Badge
              key={c}
              className="border-white/20 bg-white/15 text-white hover:bg-white/20"
            >
              {c}
            </Badge>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

export function PassportDetailGrid({ passport }: { passport: DigitalPassport }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <DetailCard title="Current medicines">
        <ul className="space-y-2">
          {passport.medicines.map((m) => (
            <li
              key={m.name}
              className="flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-background/60 px-3 py-2 text-sm"
            >
              <span className="font-medium">{m.name}</span>
              <span className="text-xs text-muted-foreground">
                {[m.dose, m.time].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      </DetailCard>

      <DetailCard title="Allergies">
        <p className="text-sm">
          {passport.allergies.length
            ? passport.allergies.join(", ")
            : "No allergies recorded"}
        </p>
      </DetailCard>

      <DetailCard title="Doctor">
        {passport.doctor ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium">{passport.doctor.name}</p>
            <p className="text-muted-foreground">{passport.doctor.specialty}</p>
            <p className="text-muted-foreground">{passport.doctor.hospital}</p>
            {passport.doctor.phone ? (
              <a
                href={`tel:${passport.doctor.phone}`}
                className="text-primary"
              >
                {passport.doctor.phone}
              </a>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No linked clinician</p>
        )}
      </DetailCard>

      <DetailCard title="Hospital & follow-up">
        <div className="space-y-1 text-sm">
          <p className="font-medium">{passport.hospital_name || "—"}</p>
          <p className="text-muted-foreground">
            Next appointment:{" "}
            {passport.next_appointment_at
              ? format(new Date(passport.next_appointment_at), "dd MMM yyyy, HH:mm")
              : "None scheduled"}
          </p>
          {passport.next_appointment_location ? (
            <p className="text-muted-foreground">
              {passport.next_appointment_location}
            </p>
          ) : null}
        </div>
      </DetailCard>

      <DetailCard title="Emergency contact" className="md:col-span-2">
        <p className="text-sm">
          {passport.emergency_contact
            ? `${passport.emergency_contact.name || "—"} · ${passport.emergency_contact.relationship || ""} · ${passport.emergency_contact.phone || ""}`
            : "—"}
        </p>
      </DetailCard>

      <DetailCard title="Medical history" className="md:col-span-2">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {passport.medical_history || "No history summary yet."}
        </p>
      </DetailCard>
    </div>
  );
}

function Stat({
  label,
  value,
  mono,
  capitalize,
}: {
  label: string;
  value: string;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-black/15 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[10px] uppercase tracking-[0.14em] text-white/65">
        {label}
      </p>
      <p
        className={`mt-1 text-sm font-semibold ${mono ? "font-mono text-xs" : ""} ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-panel rounded-3xl p-5 ${className || ""}`}>
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-3">{children}</div>
    </div>
  );
}

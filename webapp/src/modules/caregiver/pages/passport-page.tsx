import { motion } from "framer-motion";
import QRCode from "react-qr-code";

import { LoadingScreen } from "@/components/feedback/loading-screen";
import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { PassportTiltCard } from "@/modules/caregiver/components/passport-tilt-card";
import { useCaregiver } from "@/modules/caregiver/context";
import { useDigitalPassport } from "@/modules/identity/hooks";
import { identityRepository } from "@/modules/identity/repository";

export function CaregiverPassportPage() {
  const { selected, passport } = useCaregiver();
  const digital = useDigitalPassport(selected.id);

  if (digital.isLoading) {
    return <LoadingScreen label="Loading patient passport…" fullScreen={false} />;
  }

  const live = digital.data;
  const preview = live
    ? {
        name: live.full_name,
        bloodGroup: live.blood_group || "—",
        allergies: live.allergies.length ? live.allergies : ["None recorded"],
        medicines: live.medicines
          .map((m) => `${m.name} ${m.dose || ""}`.trim())
          .slice(0, 6),
        emergencyContact: live.emergency_contact?.name || passport.emergencyContact,
        emergencyPhone: live.emergency_contact?.phone || passport.emergencyPhone,
        qrValue: live.qr_token,
        abhaId: live.abha_id_demo || passport.abhaId,
      }
    : passport;

  const qrUrl = live
    ? identityRepository.emergencyQrUrl(live.qr_token)
    : preview.qrValue;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Patient Passport
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {selected.name}&apos;s health wallet
        </h1>
        <p className="mt-2 text-muted-foreground">
          Loaded from the patient passport module — blood group, allergies,
          medicines, and emergency contacts.
        </p>
      </motion.div>

      <FamilySwitcher />

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <PassportTiltCard passport={preview} href="/caregiver/passport" />
        <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Emergency scan</h2>
          <div className="mt-4 flex justify-center rounded-2xl bg-slate-50 p-6">
            <QRCode value={qrUrl} size={160} />
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="ABHA" value={preview.abhaId} />
            <Row label="Blood group" value={preview.bloodGroup} />
            <Row label="Allergies" value={preview.allergies.join(", ")} />
            <Row
              label="Emergency"
              value={`${preview.emergencyContact} · ${preview.emergencyPhone}`}
            />
            <Row label="PM-JAY" value={selected.pmjayStatus} />
            {live?.doctor ? (
              <Row
                label="Doctor"
                value={`${live.doctor.name}${live.doctor.hospital ? ` · ${live.doctor.hospital}` : ""}`}
              />
            ) : null}
          </dl>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

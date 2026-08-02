import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { useLocation } from "react-router-dom";

import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Button } from "@/components/ui/button";
import { getStore } from "@/data/store";
import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { PassportTiltCard } from "@/modules/caregiver/components/passport-tilt-card";
import { useCaregiver } from "@/modules/caregiver/context";
import { useDigitalPassport } from "@/modules/identity/hooks";
import { identityRepository } from "@/modules/identity/repository";

export function CaregiverPassportPage() {
  const { selected, passport } = useCaregiver();
  const digital = useDigitalPassport(selected.id);
  const location = useLocation();
  const [showFull, setShowFull] = useState(false);

  useEffect(() => {
    if (location.hash === "#full-passport") {
      setShowFull(true);
      document.getElementById("full-passport")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [location.hash, selected.id]);

  const live = digital.data;
  const preview = live
    ? {
        name: live.full_name,
        bloodGroup: live.blood_group || "NA",
        allergies: live.allergies.length ? live.allergies : ["NA"],
        medicines: live.medicines.length
          ? live.medicines
              .map((m) => `${m.name} ${m.dose || ""}`.trim())
              .slice(0, 6)
          : ["NA"],
        emergencyContact:
          live.emergency_contact?.name || passport.emergencyContact || "NA",
        emergencyPhone:
          live.emergency_contact?.phone || passport.emergencyPhone || "NA",
        qrValue: live.qr_token,
        abhaId: live.abha_id_demo || passport.abhaId || "NA",
      }
    : {
        ...passport,
        bloodGroup: passport.bloodGroup || "NA",
        allergies: passport.allergies?.length ? passport.allergies : ["NA"],
        medicines: passport.medicines?.length ? passport.medicines : ["NA"],
      };

  const qrUrl = live
    ? identityRepository.emergencyQrUrl(live.qr_token)
    : preview.qrValue;

  const dynamicExtras = useMemo(() => {
    const store = getStore();
    const patientId = selected.id;
    const history =
      store.patients.find((p) => p.id === patientId)?.medical_history || null;
    const notes = store.healthRecords
      .filter(
        (r) =>
          r.patient_id === patientId &&
          (r.category === "doctor_note" || r.category === "checkin"),
      )
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
      .slice(0, 6);
    const checkins = store.checkins
      .filter((c) => c.patient_id === patientId)
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
      .slice(0, 4);
    const meds = store.medicines.filter(
      (m) => m.patient_id === patientId && m.active,
    );
    return { history, notes, checkins, meds };
  }, [selected.id, digital.dataUpdatedAt]);

  if (digital.isLoading) {
    return <LoadingScreen label="Loading patient passport…" fullScreen={false} />;
  }

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
          Live passport from the patient record — blood group, allergies,
          medicines, timeline, and emergency contacts.
        </p>
      </motion.div>

      <FamilySwitcher />

      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <PassportTiltCard
          passport={preview}
          href="/caregiver/passport#full-passport"
          onOpenFull={() => {
            setShowFull(true);
            requestAnimationFrame(() => {
              document.getElementById("full-passport")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            });
          }}
        />
        <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Emergency scan</h2>
          <div className="mt-4 flex justify-center rounded-2xl bg-slate-50 p-6">
            <QRCode value={qrUrl || "NA"} size={160} />
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <Row label="ABHA" value={preview.abhaId} />
            <Row label="Blood group" value={preview.bloodGroup} />
            <Row label="Allergies" value={preview.allergies.join(", ")} />
            <Row
              label="Emergency"
              value={`${preview.emergencyContact} · ${preview.emergencyPhone}`}
            />
            <Row label="PM-JAY" value={selected.pmjayStatus || "NA"} />
            {live?.doctor ? (
              <Row
                label="Doctor"
                value={`${live.doctor.name}${live.doctor.hospital ? ` · ${live.doctor.hospital}` : ""}`}
              />
            ) : (
              <Row label="Doctor" value="NA" />
            )}
          </dl>
        </section>
      </div>

      <section
        id="full-passport"
        className="scroll-mt-24 space-y-4 rounded-[1.75rem] border border-primary/20 bg-gradient-to-br from-sky-50/80 to-white p-5 shadow-soft"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold">
              Full passport details
            </h2>
            <p className="text-xs text-muted-foreground">
              Dynamic from live store for {selected.name}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFull((v) => !v)}
          >
            {showFull ? "Collapse" : "Expand full passport"}
          </Button>
        </div>

        {(showFull || location.hash === "#full-passport") && (
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailBlock
              title="Medical history"
              body={dynamicExtras.history?.trim() || "NA — not recorded yet"}
            />
            <DetailBlock
              title="Active medicines"
              body={
                dynamicExtras.meds.length
                  ? dynamicExtras.meds
                      .map(
                        (m) =>
                          `${m.name}${m.dose ? ` ${m.dose}` : ""} · ${(m.time_slots || []).join(", ") || m.frequency || "as directed"}`,
                      )
                      .join("\n")
                  : "NA"
              }
            />
            <DetailBlock
              title="Recent check-ins"
              body={
                dynamicExtras.checkins.length
                  ? dynamicExtras.checkins
                      .map((c) => {
                        const when = new Date(c.recorded_at).toLocaleString();
                        const vitals = [
                          c.bp_systolic != null
                            ? `BP ${c.bp_systolic}/${c.bp_diastolic ?? "—"}`
                            : null,
                          c.blood_sugar != null
                            ? `Sugar ${c.blood_sugar}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ");
                        return `${when}${vitals ? ` — ${vitals}` : ""}`;
                      })
                      .join("\n")
                  : "NA"
              }
            />
            <DetailBlock
              title="Doctor / care notes"
              body={
                dynamicExtras.notes.length
                  ? dynamicExtras.notes
                      .map(
                        (n) =>
                          `${new Date(n.recorded_at).toLocaleString()} · ${n.title}: ${n.summary}`,
                      )
                      .join("\n")
                  : "NA"
              }
            />
            <DetailBlock
              title="Conditions"
              body={selected.conditionSummary || "NA"}
            />
            <DetailBlock
              title="Risk / recovery"
              body={`Risk ${selected.riskLevel || "NA"} · Recovery ${selected.recoveryScore ?? "NA"} · ${selected.trendLabel || "NA"}`}
            />
          </div>
        )}
      </section>
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

function DetailBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {title}
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{body}</p>
    </div>
  );
}

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useAssignedPatients,
  useHomeVisits,
  useSaveScreening,
} from "@/modules/rural/hooks";
import { useRuralLocale } from "@/modules/rural/i18n/locale-context";
import { ruralRepository } from "@/modules/rural/repository";
import { evaluateEmergency } from "@/modules/rural/services/emergency.service";
import type { RuralScreeningInput } from "@/modules/rural/types";

const SYMPTOM_CHIPS = [
  "Fever",
  "Cough",
  "Fatigue",
  "Headache",
  "Chest pain",
  "Shortness of breath",
  "Dizziness",
  "Swelling",
];

const empty: RuralScreeningInput = {
  patient_id: null,
  patient_name: "",
  phone: null,
  village: null,
  bp_systolic: null,
  bp_diastolic: null,
  blood_sugar: null,
  temperature: null,
  weight: null,
  oxygen: null,
  symptoms: [],
  medicine_taken: null,
  pain_score: 0,
  notes: null,
};

type Mode = "camp" | "verify";

export function RuralScreeningPage() {
  const { t } = useRuralLocale();
  const patients = useAssignedPatients();
  const visits = useHomeVisits();
  const save = useSaveScreening();
  const [mode, setMode] = useState<Mode>("camp");
  const [form, setForm] = useState<RuralScreeningInput>(empty);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [verifyToken, setVerifyToken] = useState("");
  const [verified, setVerified] = useState<{
    id: string;
    full_name: string;
    village: string | null;
    phone: string | null;
  } | null>(null);
  const [campName, setCampName] = useState("Sanand morning camp");
  const [campQueue, setCampQueue] = useState<string[]>([]);
  const [campDraftName, setCampDraftName] = useState("");

  const liveEmergency = useMemo(() => evaluateEmergency(form), [form]);

  const todayVisits = (visits.data || []).filter(
    (v) => v.status === "due" || v.status === "upcoming",
  );

  const verifyPatient = () => {
    const found = ruralRepository.findPatientByPassportOrUsername(verifyToken);
    if (!found) {
      toast.error("No patient for that passport QR / username");
      setVerified(null);
      return;
    }
    setVerified(found);
    setForm((f) => ({
      ...f,
      patient_id: found.id,
      patient_name: found.full_name,
      village: found.village,
      phone: found.phone,
    }));
    toast.success(`Verified: ${found.full_name}`);
  };

  const onSubmitIndividual = async () => {
    if (!verified?.id) {
      toast.error("Scan passport or enter username before screening");
      return;
    }
    const result = await save.mutateAsync(form);
    setDoneId(result.id);
    toast.success(t("savedLocally"));
    if (result.emergency) toast.error(t("emergencyDetected"));
    const visit = todayVisits.find((v) => v.patient_id === verified.id);
    if (visit) visits.complete.mutate(visit.id);
  };

  const onSubmitCampBatch = async () => {
    if (!campQueue.length) {
      toast.error("Add people to the camp queue first");
      return;
    }
    let saved = 0;
    for (const name of campQueue) {
      await save.mutateAsync({
        ...form,
        patient_id: null,
        patient_name: name,
        notes: `Camp: ${campName}`,
      });
      saved += 1;
    }
    toast.success(`Camp batch saved locally (${saved}) — sync when online`);
    setCampQueue([]);
    setDoneId("camp-batch");
  };

  if (doneId) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft"
      >
        <p className="font-display text-2xl font-semibold">{t("savedLocally")}</p>
        {liveEmergency.isEmergency || save.data?.emergency ? (
          <div className="rounded-2xl bg-destructive/10 p-4 text-sm text-destructive">
            <p className="font-semibold">{t("emergencyDetected")}</p>
            <ul className="mt-2 list-disc pl-4">
              {(save.data?.emergency_reasons || liveEmergency.reasons).map(
                (r) => (
                  <li key={r}>{r}</li>
                ),
              )}
            </ul>
          </div>
        ) : null}
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            className="h-12"
            onClick={() => {
              setDoneId(null);
              setForm(empty);
              setVerified(null);
              setVerifyToken("");
            }}
          >
            Continue field work
          </Button>
          <Link to="/rural/sync">
            <Button size="lg" variant="outline" className="h-12 w-full">
              {t("syncNow")}
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">Field screening</h2>
        <p className="text-sm text-muted-foreground">
          Camps are for many people at once. Individual screening only after
          passport QR or username verification. Visits are the same queue.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={mode === "camp" ? "default" : "outline"}
          className="h-11 flex-1"
          onClick={() => setMode("camp")}
        >
          Screening camp
        </Button>
        <Button
          variant={mode === "verify" ? "default" : "outline"}
          className="h-11 flex-1"
          onClick={() => setMode("verify")}
        >
          Verify & screen
        </Button>
      </div>

      {todayVisits.length ? (
        <section className="space-y-2 rounded-3xl border border-border bg-card p-4">
          <h3 className="font-display text-lg font-semibold">
            Today&apos;s visit / camp queue
          </h3>
          {todayVisits.map((v) => (
            <div
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{v.patient_name}</p>
                <p className="text-xs text-muted-foreground">
                  {v.village || "—"} · {v.scheduled_for}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="capitalize">
                  {v.status}
                </Badge>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setMode("verify");
                    setVerifyToken("");
                    setVerified(null);
                    toast.message("Verify passport/username, then screen");
                  }}
                >
                  Open
                </Button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {mode === "camp" ? (
        <section className="space-y-3 rounded-3xl border border-border bg-card p-4">
          <Label>Camp name</Label>
          <Input
            value={campName}
            onChange={(e) => setCampName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Add names as people arrive — one batch save for the whole camp
            (works offline).
          </p>
          <div className="flex gap-2">
            <Input
              value={campDraftName}
              onChange={(e) => setCampDraftName(e.target.value)}
              placeholder="Person name"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!campDraftName.trim()) return;
                setCampQueue((q) => [...q, campDraftName.trim()]);
                setCampDraftName("");
              }}
            >
              Add
            </Button>
          </div>
          <ul className="space-y-1 text-sm">
            {campQueue.map((name, i) => (
              <li
                key={`${name}-${i}`}
                className="flex justify-between rounded-lg bg-muted/50 px-3 py-2"
              >
                <span>
                  {i + 1}. {name}
                </span>
                <button
                  type="button"
                  className="text-destructive text-xs"
                  onClick={() =>
                    setCampQueue((q) => q.filter((_, idx) => idx !== i))
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <VitalsFields form={form} setForm={setForm} />
          <Button
            className="h-12 w-full"
            onClick={() => void onSubmitCampBatch()}
            disabled={save.isPending || !campQueue.length}
          >
            Save camp batch ({campQueue.length})
          </Button>
        </section>
      ) : (
        <section className="space-y-3 rounded-3xl border border-border bg-card p-4">
          <Label>Passport QR token or username</Label>
          <div className="flex gap-2">
            <Input
              value={verifyToken}
              onChange={(e) => setVerifyToken(e.target.value)}
              placeholder="HNASHA201QRDEMO or asha.patel"
              className="font-mono"
            />
            <Button type="button" onClick={verifyPatient}>
              Verify
            </Button>
          </div>
          {verified ? (
            <div className="rounded-xl bg-secondary/10 px-3 py-2 text-sm">
              Verified <strong>{verified.full_name}</strong>
              {verified.village ? ` · ${verified.village}` : ""}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Demo: <span className="font-mono">HNASHA201QRDEMO</span> or{" "}
              <span className="font-mono">asha.patel</span>
            </p>
          )}
          <VitalsFields
            form={form}
            setForm={setForm}
            disabled={!verified}
          />
          <Button
            className="h-12 w-full"
            disabled={!verified || save.isPending}
            onClick={() => void onSubmitIndividual()}
          >
            Save screening
          </Button>
        </section>
      )}

      <p className="text-xs text-muted-foreground">
        Assigned patients: {(patients.data || []).length}. Open Patients & map
        for locations.
      </p>
    </div>
  );
}

function VitalsFields({
  form,
  setForm,
  disabled,
}: {
  form: RuralScreeningInput;
  setForm: React.Dispatch<React.SetStateAction<RuralScreeningInput>>;
  disabled?: boolean;
}) {
  const setNum =
    (key: keyof RuralScreeningInput) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setForm((f) => ({
        ...f,
        [key]: v === "" ? null : Number(v),
      }));
    };

  return (
    <fieldset disabled={disabled} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>BP systolic</Label>
          <Input
            type="number"
            value={form.bp_systolic ?? ""}
            onChange={setNum("bp_systolic")}
          />
        </div>
        <div>
          <Label>BP diastolic</Label>
          <Input
            type="number"
            value={form.bp_diastolic ?? ""}
            onChange={setNum("bp_diastolic")}
          />
        </div>
        <div>
          <Label>Blood sugar</Label>
          <Input
            type="number"
            value={form.blood_sugar ?? ""}
            onChange={setNum("blood_sugar")}
          />
        </div>
        <div>
          <Label>SpO₂</Label>
          <Input
            type="number"
            value={form.oxygen ?? ""}
            onChange={setNum("oxygen")}
          />
        </div>
      </div>
      <div>
        <Label>Symptoms</Label>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {SYMPTOM_CHIPS.map((s) => {
            const on = form.symptoms.includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    symptoms: on
                      ? f.symptoms.filter((x) => x !== s)
                      : [...f.symptoms, s],
                  }))
                }
                className={
                  on
                    ? "rounded-full bg-primary px-2.5 py-1 text-xs text-primary-foreground"
                    : "rounded-full border border-border px-2.5 py-1 text-xs"
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </fieldset>
  );
}

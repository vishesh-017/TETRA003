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
import { Select } from "@/components/ui/select";
import { ruralRepository } from "@/modules/rural/repository";
import {
  listSelectableCamps,
  upsertCampBatch,
} from "@/modules/rural/services/camps.service";
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

/** Clamp impossible readings so they don't freeze lifestyle risk bars at 100. */
function sanitizeCampVitals(form: RuralScreeningInput): {
  values: Partial<RuralScreeningInput>;
  warning?: string;
} {
  const clampOrNull = (
    v: number | null,
    min: number,
    max: number,
  ): number | null => {
    if (v == null || !Number.isFinite(v)) return null;
    return Math.min(max, Math.max(min, v));
  };
  const values = {
    bp_systolic: clampOrNull(form.bp_systolic, 70, 260),
    bp_diastolic: clampOrNull(form.bp_diastolic, 40, 160),
    blood_sugar: clampOrNull(form.blood_sugar, 40, 500),
    oxygen: clampOrNull(form.oxygen, 50, 100),
  };
  const changed =
    values.bp_systolic !== form.bp_systolic ||
    values.bp_diastolic !== form.bp_diastolic ||
    values.blood_sugar !== form.blood_sugar ||
    values.oxygen !== form.oxygen;
  return {
    values,
    warning: changed
      ? "Some vitals were outside realistic ranges and were adjusted before save"
      : undefined,
  };
}

type Mode = "camp" | "verify";

type CampPerson = {
  id: string;
  name: string;
  /** Optional HealNexus portal username */
  portal_username: string;
  bp_systolic: number | null;
  bp_diastolic: number | null;
  blood_sugar: number | null;
  oxygen: number | null;
  symptoms: string[];
  open: boolean;
};

function newCampPerson(name: string): CampPerson {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    portal_username: "",
    bp_systolic: null,
    bp_diastolic: null,
    blood_sugar: null,
    oxygen: null,
    symptoms: [],
    open: true,
  };
}

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
  const selectableCamps = listSelectableCamps();
  const [campId, setCampId] = useState(
    () => listSelectableCamps()[0]?.id || "",
  );
  const selectedCamp =
    selectableCamps.find((c) => c.id === campId) || selectableCamps[0];
  const campName = selectedCamp?.name || "";
  const [campQueue, setCampQueue] = useState<CampPerson[]>([]);
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
    const vitals = sanitizeCampVitals(form);
    if (vitals.warning) toast.message(vitals.warning);
    const result = await save.mutateAsync({ ...form, ...vitals.values });
    setDoneId(result.id);
    toast.success(t("savedLocally"));
    if (result.emergency) toast.error(t("emergencyDetected"));
    const visit = todayVisits.find((v) => v.patient_id === verified.id);
    if (visit) visits.complete.mutate(visit.id);
  };

  const onSubmitCampBatch = async () => {
    if (!campName) {
      toast.error("Select a camp from the dropdown — admins create camps");
      return;
    }
    if (!campQueue.length) {
      toast.error("Add people to the camp queue first");
      return;
    }
    let saved = 0;
    const errors: string[] = [];
    for (const person of campQueue) {
      const row: RuralScreeningInput = {
        ...empty,
        patient_id: null,
        patient_name: person.name,
        portal_username: person.portal_username.trim() || null,
        village: selectedCamp?.villageKey || "Ahmedabad",
        bp_systolic: person.bp_systolic,
        bp_diastolic: person.bp_diastolic,
        blood_sugar: person.blood_sugar,
        oxygen: person.oxygen,
        symptoms: person.symptoms,
        notes: `Camp: ${campName}`,
      };
      const vitals = sanitizeCampVitals(row);
      if (vitals.warning) toast.message(`${person.name}: ${vitals.warning}`);
      try {
        await save.mutateAsync({ ...row, ...vitals.values });
        saved += 1;
      } catch (e) {
        errors.push(
          `${person.name}: ${e instanceof Error ? e.message : "save failed"}`,
        );
      }
    }
    if (saved > 0) {
      if (!campName) {
        toast.error("Select a camp from the dropdown (admin creates camps)");
        return;
      }
      const updated = upsertCampBatch({
        name: campName,
        screened: saved,
        portalUsernames: campQueue
          .map((p) => p.portal_username.trim())
          .filter(Boolean),
      });
      if (!updated) {
        toast.error("Camp not found — ask admin to create it first");
        return;
      }
      toast.success(
        `Saved ${saved} person(s) — ${campName} updated on Camps & map`,
      );
      setCampQueue([]);
      setDoneId("camp-batch");
    }
    if (errors.length) {
      toast.error(errors[0] || "Some camp rows failed to save");
    }
    if (saved === 0 && !errors.length) {
      toast.error("Nothing was saved — try again");
    }
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
          <Label>Camp (admin-created)</Label>
          <Select
            value={selectedCamp?.id || campId}
            onChange={(e) => setCampId(e.target.value)}
            disabled={!selectableCamps.length}
          >
            {!selectableCamps.length ? (
              <option value="">No camps yet — ask admin to create one</option>
            ) : (
              selectableCamps.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · {c.villageKey}
                </option>
              ))
            )}
          </Select>
          {selectedCamp ? (
            <p className="text-xs text-muted-foreground">
              {selectedCamp.place} · Ahmedabad
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Pick a camp from the list (only admins can create camps). Add each
            person with their own BP, sugar, SpO₂ and symptoms. Batch save stores
            everyone offline.
          </p>
          <div className="flex gap-2">
            <Input
              value={campDraftName}
              onChange={(e) => setCampDraftName(e.target.value)}
              placeholder="Person name"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!campDraftName.trim()) return;
                  setCampQueue((q) => [
                    ...q.map((p) => ({ ...p, open: false })),
                    newCampPerson(campDraftName.trim()),
                  ]);
                  setCampDraftName("");
                }
              }}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (!campDraftName.trim()) return;
                setCampQueue((q) => [
                  ...q.map((p) => ({ ...p, open: false })),
                  newCampPerson(campDraftName.trim()),
                ]);
                setCampDraftName("");
              }}
            >
              Add
            </Button>
          </div>
          <ul className="space-y-3">
            {campQueue.map((person, i) => (
              <li
                key={person.id}
                className="rounded-2xl border border-border bg-muted/30 p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className="text-left text-sm font-medium"
                    onClick={() =>
                      setCampQueue((q) =>
                        q.map((p) =>
                          p.id === person.id
                            ? { ...p, open: !p.open }
                            : { ...p, open: false },
                        ),
                      )
                    }
                  >
                    {i + 1}. {person.name}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {person.open ? "· hide vitals" : "· edit vitals"}
                      {person.bp_systolic != null
                        ? ` · BP ${person.bp_systolic}/${person.bp_diastolic ?? "—"}`
                        : ""}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="text-destructive text-xs"
                    onClick={() =>
                      setCampQueue((q) => q.filter((p) => p.id !== person.id))
                    }
                  >
                    Remove
                  </button>
                </div>
                {person.open ? (
                  <div className="mt-3 space-y-2">
                    <div>
                      <Label className="text-xs">
                        Portal username (optional)
                      </Label>
                      <Input
                        value={person.portal_username}
                        onChange={(e) =>
                          setCampQueue((q) =>
                            q.map((p) =>
                              p.id === person.id
                                ? { ...p, portal_username: e.target.value }
                                : p,
                            ),
                          )
                        }
                        placeholder="e.g. asha.patel — leave blank if new"
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          ["bp_systolic", "BP systolic"],
                          ["bp_diastolic", "BP diastolic"],
                          ["blood_sugar", "Blood sugar"],
                          ["oxygen", "SpO₂"],
                        ] as const
                      ).map(([key, label]) => (
                        <div key={key}>
                          <Label className="text-xs">{label}</Label>
                          <Input
                            type="number"
                            value={person[key] ?? ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCampQueue((q) =>
                                q.map((p) =>
                                  p.id === person.id
                                    ? {
                                        ...p,
                                        [key]:
                                          v === "" ? null : Number(v),
                                      }
                                    : p,
                                ),
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <Label className="text-xs">Symptoms</Label>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {SYMPTOM_CHIPS.map((s) => {
                          const on = person.symptoms.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() =>
                                setCampQueue((q) =>
                                  q.map((p) =>
                                    p.id === person.id
                                      ? {
                                          ...p,
                                          symptoms: on
                                            ? p.symptoms.filter((x) => x !== s)
                                            : [...p.symptoms, s],
                                        }
                                      : p,
                                  ),
                                )
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
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
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
        Assigned patients: {(patients.data || []).length}. Open Camps & map for
        Ahmedabad camp + patient pins.
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

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useRuralLocale } from "@/modules/rural/i18n/locale-context";
import {
  useAssignedPatients,
  useRegisterPatient,
  useSaveScreening,
} from "@/modules/rural/hooks";
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

export function RuralScreeningPage() {
  const { t } = useRuralLocale();
  const patients = useAssignedPatients();
  const save = useSaveScreening();
  const register = useRegisterPatient();
  const [mode, setMode] = useState<"select" | "register">("select");
  const [form, setForm] = useState<RuralScreeningInput>(empty);
  const [doneId, setDoneId] = useState<string | null>(null);

  const liveEmergency = useMemo(() => evaluateEmergency(form), [form]);

  const onSubmit = async () => {
    if (!form.patient_name.trim()) {
      toast.error("Patient name required");
      return;
    }
    const result = await save.mutateAsync(form);
    setDoneId(result.id);
    toast.success(t("savedLocally"));
    if (result.emergency) toast.error(t("emergencyDetected"));
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
            <p className="mt-1">{t("notifyDoctor")}</p>
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
            }}
          >
            {t("startScreening")}
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
      <div className="flex gap-2">
        <Button
          variant={mode === "select" ? "default" : "outline"}
          className="flex-1 h-11"
          onClick={() => setMode("select")}
        >
          {t("selectPatient")}
        </Button>
        <Button
          variant={mode === "register" ? "default" : "outline"}
          className="flex-1 h-11"
          onClick={() => setMode("register")}
        >
          {t("registerPatient")}
        </Button>
      </div>

      {mode === "select" ? (
        <div className="space-y-2">
          {(patients.data || []).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() =>
                setForm((f) => ({
                  ...f,
                  patient_id: p.id,
                  patient_name: p.full_name,
                  phone: p.phone,
                  village: p.village,
                }))
              }
              className={`w-full rounded-2xl border px-4 py-3 text-left ${
                form.patient_id === p.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card"
              }`}
            >
              <p className="font-medium">{p.full_name}</p>
              <p className="text-xs text-muted-foreground">
                {p.village || "—"} · {p.conditions.join(", ") || "No conditions"}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3 rounded-3xl border border-border bg-card p-4">
          <Field
            label={t("name")}
            value={form.patient_name}
            onChange={(v) => setForm((f) => ({ ...f, patient_name: v }))}
          />
          <Field
            label={t("phone")}
            value={form.phone || ""}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
          />
          <Field
            label={t("village")}
            value={form.village || ""}
            onChange={(v) => setForm((f) => ({ ...f, village: v }))}
          />
          <Button
            size="lg"
            className="h-12 w-full"
            disabled={register.isPending || !form.patient_name.trim()}
            onClick={async () => {
              const id = await register.mutateAsync({
                full_name: form.patient_name,
                phone: form.phone || undefined,
                village: form.village || undefined,
              });
              setForm((f) => ({ ...f, patient_id: id }));
              setMode("select");
              toast.success(t("savedLocally"));
            }}
          >
            {t("registerPatient")}
          </Button>
        </div>
      )}

      <div className="space-y-3 rounded-3xl border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <Num
            label={`${t("bloodPressure")} (sys)`}
            value={form.bp_systolic}
            onChange={(v) => setForm((f) => ({ ...f, bp_systolic: v }))}
          />
          <Num
            label="Dia"
            value={form.bp_diastolic}
            onChange={(v) => setForm((f) => ({ ...f, bp_diastolic: v }))}
          />
          <Num
            label={t("bloodSugar")}
            value={form.blood_sugar}
            onChange={(v) => setForm((f) => ({ ...f, blood_sugar: v }))}
          />
          <Num
            label={`${t("temperature")} °F`}
            value={form.temperature}
            onChange={(v) => setForm((f) => ({ ...f, temperature: v }))}
          />
          <Num
            label={`${t("weight")} kg`}
            value={form.weight}
            onChange={(v) => setForm((f) => ({ ...f, weight: v }))}
          />
          <Num
            label={`${t("oxygen")} %`}
            value={form.oxygen}
            onChange={(v) => setForm((f) => ({ ...f, oxygen: v }))}
          />
        </div>

        <div>
          <p className="mb-2 text-sm text-muted-foreground">{t("symptoms")}</p>
          <div className="flex flex-wrap gap-2">
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
                  className={`rounded-full px-3 py-2 text-sm ${
                    on
                      ? "bg-primary text-primary-foreground"
                      : "border border-border"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-muted-foreground">
            {t("medicineTaken")}
          </p>
          <div className="flex gap-2">
            <Button
              variant={form.medicine_taken === true ? "default" : "outline"}
              className="h-12 flex-1"
              onClick={() => setForm((f) => ({ ...f, medicine_taken: true }))}
            >
              {t("yes")}
            </Button>
            <Button
              variant={form.medicine_taken === false ? "default" : "outline"}
              className="h-12 flex-1"
              onClick={() => setForm((f) => ({ ...f, medicine_taken: false }))}
            >
              {t("no")}
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm text-muted-foreground">
            {t("painLevel")}: {form.pain_score ?? 0}
          </p>
          <input
            type="range"
            min={0}
            max={10}
            value={form.pain_score ?? 0}
            className="w-full accent-[hsl(var(--primary))]"
            onChange={(e) =>
              setForm((f) => ({ ...f, pain_score: Number(e.target.value) }))
            }
          />
        </div>

        <Field
          label={t("notes")}
          value={form.notes || ""}
          onChange={(v) => setForm((f) => ({ ...f, notes: v }))}
        />

        {liveEmergency.isEmergency ? (
          <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
            <p className="font-semibold">{t("emergencyDetected")}</p>
            <p>{liveEmergency.reasons.join(" · ")}</p>
          </div>
        ) : null}

        <Button
          size="lg"
          className="h-14 w-full text-base"
          disabled={save.isPending}
          onClick={() => void onSubmit()}
        >
          {t("submit")}
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-12 w-full rounded-2xl border border-input bg-background px-3 text-base"
      />
    </label>
  );
}

function Num({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
        className="flex h-12 w-full rounded-2xl border border-input bg-background px-3 text-base"
      />
    </label>
  );
}

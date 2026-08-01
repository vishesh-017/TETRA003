import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { getStore, subscribeStore } from "@/data/store";
import { cn } from "@/lib/utils";
import { usePatientMutations } from "@/modules/patient/hooks";
import {
  checkInSchema,
  type CheckInSchema,
} from "@/modules/patient/schemas";

const STEPS = ["Vitals", "Wellbeing", "Habits", "Review"] as const;

const SYMPTOM_OPTIONS = [
  "Fatigue",
  "Dizziness",
  "Headache",
  "Shortness of breath",
  "Chest discomfort",
  "Nausea",
];

export function CheckInPage() {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [tick, setTick] = useState(0);
  const { submitCheckIn } = usePatientMutations();
  const form = useForm<CheckInSchema>({
    resolver: zodResolver(checkInSchema) as never,
    defaultValues: {
      symptoms: [],
      medicine_taken: true,
      mood: "okay",
      pain_score: 2,
      sleep_hours: 7,
      water_intake: 6,
    },
  });

  useEffect(() => subscribeStore(() => setTick((n) => n + 1)), []);

  const timeline = useMemo(() => {
    void tick;
    if (!user?.id) return [];
    const store = getStore();
    const patient = store.patients.find((p) => p.user_id === user.id);
    if (!patient) return [];
    return store.checkins
      .filter((c) => c.patient_id === patient.id)
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
      .slice(0, 12);
  }, [user?.id, tick]);

  const symptoms = form.watch("symptoms") || [];
  const fieldErrors = form.formState.errors;

  const goNext = async () => {
    if (step === 0) {
      const ok = await form.trigger([
        "bp_systolic",
        "bp_diastolic",
        "blood_sugar",
        "temperature",
        "weight",
        "oxygen",
      ]);
      if (!ok) {
        const msg =
          form.formState.errors.bp_diastolic?.message ||
          form.formState.errors.bp_systolic?.message ||
          form.formState.errors.blood_sugar?.message ||
          "Fix invalid vitals before continuing";
        toast.error(String(msg));
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const onSubmit = form.handleSubmit(
    async (values) => {
      try {
        await submitCheckIn.mutateAsync(values);
        setDone(true);
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Could not save check-in",
        );
      }
    },
    (errors) => {
      const first = Object.values(errors)[0];
      toast.error(
        typeof first?.message === "string"
          ? first.message
          : "Diastolic BP must be 40–150. Fix vitals and try again.",
      );
      setStep(0);
    },
  );

  if (done) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="rounded-3xl border border-secondary/30 bg-secondary/10 px-8 py-10 shadow-soft"
        >
          <h1 className="font-display text-3xl font-semibold text-secondary">
            Great! Your health log has been recorded.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Your Recovery Score will reflect today's check-in.
          </p>
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => {
              setDone(false);
              setStep(0);
            }}
          >
            View timeline
          </Button>
          <Link
            to="/patient"
            className={cn(buttonVariants(), "mt-3 inline-flex")}
          >
            Back to Today
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl pb-10">
      <h1 className="font-display text-3xl font-semibold">Daily Health Check-in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        A short multi-step log — takes under 2 minutes.
      </p>

      <div className="mt-5 flex gap-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i <= step ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      <Card className="mt-5">
        <CardHeader>
          <CardTitle>{STEPS[step]}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                className="space-y-4"
              >
                {step === 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      label="Blood pressure (systolic)"
                      id="bp_s"
                      error={fieldErrors.bp_systolic?.message}
                    >
                      <Input type="number" {...form.register("bp_systolic")} />
                    </Field>
                    <Field
                      label="Blood pressure (diastolic)"
                      id="bp_d"
                      error={fieldErrors.bp_diastolic?.message}
                    >
                      <Input type="number" {...form.register("bp_diastolic")} />
                    </Field>
                    <Field
                      label="Blood sugar"
                      id="sugar"
                      error={fieldErrors.blood_sugar?.message}
                    >
                      <Input type="number" {...form.register("blood_sugar")} />
                    </Field>
                    <Field
                      label="Temperature (°F)"
                      id="temp"
                      error={fieldErrors.temperature?.message}
                    >
                      <Input type="number" step="0.1" {...form.register("temperature")} />
                    </Field>
                    <Field
                      label="Weight (kg)"
                      id="weight"
                      error={fieldErrors.weight?.message}
                    >
                      <Input type="number" step="0.1" {...form.register("weight")} />
                    </Field>
                    <Field
                      label="Oxygen level (%)"
                      id="o2"
                      error={fieldErrors.oxygen?.message}
                    >
                      <Input type="number" {...form.register("oxygen")} />
                    </Field>
                    <p className="sm:col-span-2 text-xs text-muted-foreground">
                      Typical ranges: systolic 70–250 · diastolic 40–150 · sugar
                      40–600. Leave blank if not measured.
                    </p>
                  </div>
                ) : null}

                {step === 1 ? (
                  <>
                    <Field label="Pain level (0–10)" id="pain">
                      <Input type="number" min={0} max={10} {...form.register("pain_score")} />
                    </Field>
                    <Field label="Mood" id="mood">
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
                        {...form.register("mood")}
                      >
                        <option value="great">Great</option>
                        <option value="okay">Okay</option>
                        <option value="low">Low</option>
                        <option value="anxious">Anxious</option>
                      </select>
                    </Field>
                    <div>
                      <Label>Symptoms</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {SYMPTOM_OPTIONS.map((s) => {
                          const active = symptoms.includes(s);
                          return (
                            <button
                              key={s}
                              type="button"
                              className={cn(
                                "rounded-full border px-3 py-1 text-xs",
                                active
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border bg-card",
                              )}
                              onClick={() => {
                                const next = active
                                  ? symptoms.filter((x) => x !== s)
                                  : [...symptoms, s];
                                form.setValue("symptoms", next);
                              }}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : null}

                {step === 2 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Sleep hours" id="sleep">
                      <Input type="number" step="0.5" {...form.register("sleep_hours")} />
                    </Field>
                    <Field label="Water intake (glasses)" id="water">
                      <Input type="number" {...form.register("water_intake")} />
                    </Field>
                    <Field label="Exercise" id="exercise">
                      <Input placeholder="e.g. 20 min walk" {...form.register("exercise")} />
                    </Field>
                    <Field label="Medicine taken?" id="meds">
                      <select
                        className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
                        value={form.watch("medicine_taken") ? "yes" : "no"}
                        onChange={(e) =>
                          form.setValue("medicine_taken", e.target.value === "yes")
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Notes" id="notes">
                        <Textarea rows={3} {...form.register("notes")} />
                      </Field>
                    </div>
                  </div>
                ) : null}

                {step === 3 ? (
                  <div className="space-y-2 rounded-2xl bg-muted/50 p-4 text-sm">
                    <p>BP: {form.watch("bp_systolic") || "—"} / {form.watch("bp_diastolic") || "—"}</p>
                    <p>Sugar: {form.watch("blood_sugar") || "—"}</p>
                    <p>Pain: {form.watch("pain_score") ?? "—"} · Mood: {form.watch("mood")}</p>
                    <p>Sleep: {form.watch("sleep_hours") ?? "—"}h · Water: {form.watch("water_intake") ?? "—"}</p>
                    <p>Symptoms: {symptoms.length ? symptoms.join(", ") : "None"}</p>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={step === 0}
                onClick={() => setStep((s) => s - 1)}
              >
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={() => void goNext()}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" disabled={submitCheckIn.isPending}>
                  {submitCheckIn.isPending ? "Saving…" : "Submit check-in"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="mt-8 space-y-3">
        <h2 className="font-display text-xl font-semibold">Check-in timeline</h2>
        <p className="text-sm text-muted-foreground">
          Recent logs that feed Recovery Score and doctor alerts.
        </p>
        {!timeline.length ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
            No check-ins yet — submit one above.
          </p>
        ) : (
          <ol className="relative space-y-3 border-l border-border pl-4">
            {timeline.map((c) => (
              <li key={c.id} className="relative">
                <span className="absolute -left-[1.3rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                <div className="rounded-2xl border border-border bg-card px-3 py-2.5 text-sm">
                  <p className="font-medium">
                    {new Date(c.recorded_at).toLocaleString()}
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {[
                      c.bp_systolic != null && c.bp_diastolic != null
                        ? `BP ${c.bp_systolic}/${c.bp_diastolic}`
                        : null,
                      c.blood_sugar != null ? `Sugar ${c.blood_sugar}` : null,
                      c.mood ? `Mood ${c.mood}` : null,
                      c.medicine_taken === true
                        ? "Meds taken"
                        : c.medicine_taken === false
                          ? "Meds missed"
                          : null,
                      c.symptoms?.length
                        ? c.symptoms.slice(0, 3).join(", ")
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Logged"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  id,
  children,
  error,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useIdentityMutations } from "@/modules/identity/hooks";
import type {
  PmjayEligibilityResult,
  PmjayWizardAnswers,
} from "@/modules/identity/types";

const STEPS = [
  "Basic information",
  "Family information",
  "Income category",
  "State",
  "Eligibility result",
] as const;

const EMPTY: PmjayWizardAnswers = {
  full_name: "",
  age: "",
  family_size: "4",
  rural: "yes",
  income_category: "low",
  state: "Gujarat",
  secc_listed: "unsure",
  has_ayushman_card: "unsure",
};

export function PmjayWizard() {
  const { user } = useAuth();
  const { savePmjay } = useIdentityMutations();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PmjayWizardAnswers>({
    ...EMPTY,
    full_name: user?.full_name || "",
  });
  const [result, setResult] = useState<PmjayEligibilityResult | null>(null);

  const progress = useMemo(
    () => ((step + 1) / STEPS.length) * 100,
    [step],
  );

  const next = async () => {
    if (step < STEPS.length - 2) {
      setStep((s) => s + 1);
      return;
    }
    if (step === STEPS.length - 2) {
      const res = await savePmjay.mutateAsync(answers);
      setResult(res);
      setStep(STEPS.length - 1);
    }
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="glass-panel rounded-[1.75rem] p-5 sm:p-7">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        PM-JAY Assistant
      </p>
      <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
        Government benefits, conversationally
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        A guided check — never an official eligibility certificate.
      </p>

      <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 20 }}
        />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.2 }}
          className="mt-6 min-h-[220px]"
        >
          {step === 0 ? (
            <div className="space-y-3">
              <Field
                label="Full name"
                value={answers.full_name}
                onChange={(v) => setAnswers((a) => ({ ...a, full_name: v }))}
              />
              <Field
                label="Age"
                value={answers.age}
                onChange={(v) => setAnswers((a) => ({ ...a, age: v }))}
                placeholder="48"
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              <Field
                label="Family size"
                value={answers.family_size}
                onChange={(v) => setAnswers((a) => ({ ...a, family_size: v }))}
              />
              <Choice
                label="Do you live in a rural area?"
                value={answers.rural}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                ]}
                onChange={(v) => setAnswers((a) => ({ ...a, rural: v }))}
              />
              <Choice
                label="SECC / beneficiary list?"
                value={answers.secc_listed}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "unsure", label: "Not sure" },
                ]}
                onChange={(v) => setAnswers((a) => ({ ...a, secc_listed: v }))}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <Choice
                label="Income category"
                value={answers.income_category}
                options={[
                  { value: "bpl", label: "BPL / Antyodaya" },
                  { value: "low", label: "Low income" },
                  { value: "middle", label: "Middle income" },
                  { value: "high", label: "Higher income" },
                ]}
                onChange={(v) =>
                  setAnswers((a) => ({ ...a, income_category: v }))
                }
              />
              <Choice
                label="Ayushman card / eligible ID?"
                value={answers.has_ayushman_card}
                options={[
                  { value: "yes", label: "Yes" },
                  { value: "no", label: "No" },
                  { value: "unsure", label: "Not sure" },
                ]}
                onChange={(v) =>
                  setAnswers((a) => ({ ...a, has_ayushman_card: v }))
                }
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <label className="block space-y-1.5 text-sm">
                <span className="text-muted-foreground">State</span>
                <select
                  className="flex h-11 w-full rounded-2xl border border-input bg-background px-3"
                  value={answers.state}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, state: e.target.value }))
                  }
                >
                  {[
                    "Gujarat",
                    "Rajasthan",
                    "Maharashtra",
                    "Madhya Pradesh",
                    "Other",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-muted-foreground">
                Next, we estimate possible benefits from your answers — then
                suggest documents and nearby hospitals.
              </p>
            </div>
          ) : null}

          {step === 4 && result ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Result · confidence {(result.confidence * 100).toFixed(0)}%
                </p>
                <p className="mt-2 font-display text-xl font-semibold">
                  {result.headline}
                </p>
              </div>
              <Block title="Possible benefits" items={result.benefits} />
              <Block title="Required documents" items={result.documents} />
              <Block title="Next steps" items={result.next_steps.slice(0, 4)} />
              {result.nearest_hospital ? (
                <div className="rounded-2xl border border-border p-4 text-sm">
                  <p className="font-medium">Nearest PM-JAY hospital</p>
                  <p className="mt-1">{result.nearest_hospital.name}</p>
                  <p className="text-muted-foreground">
                    {result.nearest_hospital.address}
                  </p>
                  <a
                    href={`tel:${result.nearest_hospital.phone}`}
                    className="mt-1 inline-block text-primary"
                  >
                    {result.nearest_hospital.phone}
                  </a>
                </div>
              ) : null}
              <p className="text-sm">
                Government helpline:{" "}
                <a href={`tel:${result.helpline}`} className="font-semibold text-primary">
                  {result.helpline}
                </a>
              </p>
              <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {step < 4 ? (
        <div className="mt-6 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={back}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button
            className="flex-1"
            onClick={() => void next()}
            disabled={savePmjay.isPending}
          >
            {step === 3
              ? savePmjay.isPending
                ? "Checking…"
                : "See result"
              : "Continue"}
          </Button>
        </div>
      ) : (
        <Button
          className="mt-6 w-full"
          variant="outline"
          onClick={() => {
            setStep(0);
            setResult(null);
          }}
        >
          Start over
        </Button>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex h-11 w-full rounded-2xl border border-input bg-background px-3"
      />
    </label>
  );
}

function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-full px-3.5 py-2 text-sm transition ${
              value === o.value
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i}>• {i}</li>
        ))}
      </ul>
    </div>
  );
}

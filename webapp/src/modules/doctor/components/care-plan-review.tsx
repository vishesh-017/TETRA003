import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  Moon,
  Pill,
  Sparkles,
  Stethoscope,
  Sun,
  Sunset,
  XCircle,
} from "lucide-react";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { instructionsToList } from "@/modules/doctor/care-companion-integration";
import type { CarePlan } from "@/modules/doctor/types";

interface CarePlanReviewProps {
  carePlan: CarePlan;
  generating?: boolean;
  approving?: boolean;
  rejecting?: boolean;
  saving?: boolean;
  onApprove: (payload: {
    doctor_review_notes: string;
    caregiver_instructions: string;
    patient_friendly_instructions: string;
    warning_signs: string[];
    next_steps: string[];
  }) => void;
  onReject: (notes: string) => void;
  onSaveDraft?: (payload: {
    doctor_review_notes: string;
    caregiver_instructions: string;
    patient_friendly_instructions: string;
    warning_signs: string[];
    next_steps: string[];
  }) => void;
}

const PERIODS = [
  { key: "morning" as const, label: "Morning", icon: Sun },
  { key: "afternoon" as const, label: "Afternoon", icon: Sunset },
  { key: "evening" as const, label: "Evening", icon: Moon },
  { key: "night" as const, label: "Night", icon: Moon },
];

function GeneratingPanel() {
  const steps = [
    "Reading doctor discharge notes",
    "Organizing medicine schedule",
    "Building morning → night tasks",
    "Preparing caregiver instructions",
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, [steps.length]);

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-card to-secondary/10">
      <CardContent className="space-y-5 p-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2.4, ease: "linear" }}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary"
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
          <div>
            <p className="font-display text-xl font-semibold">
              Generating AI Recovery Plan…
            </p>
            <p className="text-sm text-muted-foreground">
              Organizing your discharge summary — not diagnosing or prescribing.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {steps.map((label, i) => (
            <motion.div
              key={label}
              animate={{ opacity: i === step ? 1 : 0.45, x: i === step ? 4 : 0 }}
              className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm"
            >
              <span
                className={`h-2 w-2 rounded-full ${i === step ? "bg-primary" : "bg-muted-foreground/40"}`}
              />
              {label}
            </motion.div>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-24 animate-pulse rounded-2xl bg-muted/70"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CarePlanReview({
  carePlan,
  generating,
  approving,
  rejecting,
  saving,
  onApprove,
  onReject,
  onSaveDraft,
}: CarePlanReviewProps) {
  const pending =
    carePlan.status === "ai_draft" || carePlan.status === "generating";
  const isGenerating = Boolean(generating || carePlan.status === "generating");

  const [notes, setNotes] = useState(carePlan.doctor_review_notes ?? "");
  const [patientText, setPatientText] = useState(
    carePlan.patient_friendly_instructions ?? "",
  );
  const [caregiverText, setCaregiverText] = useState(
    carePlan.caregiver_instructions ?? "",
  );
  const [warningsText, setWarningsText] = useState(
    (carePlan.warning_signs || []).join("\n"),
  );
  const [nextStepsText, setNextStepsText] = useState(
    (carePlan.next_steps || []).join("\n"),
  );
  const [openSection, setOpenSection] = useState<string | null>("schedule");

  useEffect(() => {
    setNotes(carePlan.doctor_review_notes ?? "");
    setPatientText(carePlan.patient_friendly_instructions ?? "");
    setCaregiverText(carePlan.caregiver_instructions ?? "");
    setWarningsText((carePlan.warning_signs || []).join("\n"));
    setNextStepsText((carePlan.next_steps || []).join("\n"));
  }, [carePlan.id, carePlan.updated_at, carePlan.status]);

  if (isGenerating) return <GeneratingPanel />;

  const source = carePlan.source_discharge;
  const payload = () => ({
    doctor_review_notes: notes,
    caregiver_instructions: caregiverText,
    patient_friendly_instructions: patientText,
    warning_signs: warningsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    next_steps: nextStepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
  });

  const toggle = (id: string) =>
    setOpenSection((cur) => (cur === id ? null : id));

  return (
    <div className="space-y-4">
      <AiDisclaimer />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={pending ? "warning" : "secondary"}>
          {carePlan.status.replaceAll("_", " ")}
        </Badge>
        <Badge variant="outline">Version {carePlan.version}</Badge>
        <p className="text-sm text-muted-foreground">{carePlan.disclaimer}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/80 bg-gradient-to-b from-card to-muted/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-4 w-4 text-primary" />
              Doctor Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {!source ? (
              <p>No linked discharge summary.</p>
            ) : (
              <>
                <NoteBlock label="Diagnosis" value={source.diagnosis_text} />
                <NoteBlock label="Medicines" value={source.medicines_text} />
                <NoteBlock label="Doctor notes" value={source.doctor_notes} />
                <NoteBlock label="Diet" value={source.diet_advice} />
                <NoteBlock label="Exercise" value={source.exercise_advice} />
                <NoteBlock label="Restrictions" value={source.restrictions} />
                <NoteBlock
                  label="Special instructions"
                  value={source.special_instructions}
                />
                <NoteBlock label="Follow-up" value={source.follow_up_date} />
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-b from-primary/5 to-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Organized Recovery Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Patient explanation
              </p>
              {pending ? (
                <Textarea
                  value={patientText}
                  onChange={(e) => setPatientText(e.target.value)}
                  rows={4}
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {patientText}
                </p>
              )}
            </div>

            <Accordion
              id="schedule"
              open={openSection === "schedule"}
              onToggle={() => toggle("schedule")}
              title="Daily schedule"
              icon={<Sun className="h-4 w-4" />}
            >
              <div className="space-y-3">
                {PERIODS.map(({ key, label, icon: Icon }) => {
                  const items = carePlan.daily_schedule?.[key] || [];
                  return (
                    <div key={key} className="rounded-xl border border-border/70 p-3">
                      <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        {label}
                      </p>
                      {items.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No items</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {items.map((item, i) => (
                            <li key={`${key}-${i}`} className="text-sm">
                              <span className="font-medium">{item.title}</span>
                              <span className="text-muted-foreground">
                                {" "}
                                — {item.detail}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </Accordion>

            <Accordion
              id="meds"
              open={openSection === "meds"}
              onToggle={() => toggle("meds")}
              title="Medicine schedule"
              icon={<Pill className="h-4 w-4" />}
            >
              {carePlan.medicines.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No medicines listed on the discharge summary.
                </p>
              ) : (
                <div className="space-y-2">
                  {carePlan.medicines.map((med) => (
                    <div
                      key={med.id}
                      className="rounded-xl border border-border p-3"
                    >
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {[med.dose, med.frequency]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Accordion>

            <Accordion
              id="caregiver"
              open={openSection === "caregiver"}
              onToggle={() => toggle("caregiver")}
              title="Caregiver instructions"
              icon={<HeartPulse className="h-4 w-4" />}
            >
              {pending ? (
                <Textarea
                  value={caregiverText}
                  onChange={(e) => setCaregiverText(e.target.value)}
                  rows={4}
                />
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {instructionsToList(caregiverText).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </Accordion>

            <Accordion
              id="warnings"
              open={openSection === "warnings"}
              onToggle={() => toggle("warnings")}
              title="Warning signs"
              icon={<AlertTriangle className="h-4 w-4" />}
            >
              {pending ? (
                <Textarea
                  value={warningsText}
                  onChange={(e) => setWarningsText(e.target.value)}
                  rows={4}
                  placeholder="One warning sign per line"
                />
              ) : (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {carePlan.warning_signs.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              )}
            </Accordion>

            <Accordion
              id="followup"
              open={openSection === "followup"}
              onToggle={() => toggle("followup")}
              title="Follow-up timeline"
              icon={<ClipboardList className="h-4 w-4" />}
            >
              {pending ? (
                <Textarea
                  value={nextStepsText}
                  onChange={(e) => setNextStepsText(e.target.value)}
                  rows={4}
                  placeholder="One next step per line"
                />
              ) : (
                <div className="space-y-2">
                  {(carePlan.followup_timeline || []).map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-border px-3 py-2 text-sm"
                    >
                      {String(item.title || "Follow-up")}
                      {item.due_date ? ` · ${String(item.due_date)}` : null}
                    </div>
                  ))}
                </div>
              )}
            </Accordion>
          </CardContent>
        </Card>
      </div>

      {pending ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Doctor review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional review notes before publishing"
            />
            <div className="flex flex-wrap gap-2">
              {onSaveDraft ? (
                <Button
                  variant="outline"
                  disabled={saving || approving || rejecting}
                  onClick={() => onSaveDraft(payload())}
                >
                  {saving ? "Saving…" : "Save edits"}
                </Button>
              ) : null}
              <Button
                disabled={approving || rejecting || saving}
                onClick={() => onApprove(payload())}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {approving ? "Publishing…" : "Approve & publish"}
              </Button>
              <Button
                variant="destructive"
                disabled={approving || rejecting || saving}
                onClick={() => onReject(notes)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                {rejecting ? "Rejecting…" : "Reject draft"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function NoteBlock({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/70">
        {label}
      </p>
      <p className="mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function Accordion({
  id,
  open,
  onToggle,
  title,
  icon,
  children,
}: {
  id: string;
  open: boolean;
  onToggle: () => void;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/60">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium"
        aria-expanded={open}
        aria-controls={`panel-${id}`}
      >
        <span className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          {title}
        </span>
        <span className="text-xs text-muted-foreground">{open ? "Hide" : "Show"}</span>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={`panel-${id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/70 px-3 py-3">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

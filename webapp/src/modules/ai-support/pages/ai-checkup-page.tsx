import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  PhoneCall,
  Siren,
} from "lucide-react";
import { toast } from "sonner";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { runEmergencyTriage } from "@/modules/ai-support/emergency-triage";

const QUICK = [
  "Sudden chest pain / heartache",
  "Shortness of breath",
  "Severe dizziness or nearly fainted",
  "Very high blood sugar symptoms",
  "Stroke-like face droop or arm weakness",
];

function riskClass(level: string) {
  if (level === "critical") return "bg-red-100 text-red-700";
  if (level === "high") return "bg-orange-100 text-orange-700";
  if (level === "moderate") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-700";
}

export function AiCheckupPage() {
  const { user } = useAuth();
  const [symptom, setSymptom] = useState("");
  const [submitted, setSubmitted] = useState("");

  const result = useMemo(() => {
    if (!user?.id || !submitted) return null;
    return runEmergencyTriage(user.id, submitted);
  }, [user?.id, submitted]);

  if (!user?.id) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Sign in as a patient for emergency AI checkup.
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-10">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-rose-950 via-rose-900 to-orange-900 p-6 text-white sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          <Siren className="h-3.5 w-3.5" />
          Emergency AI checkup
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight">
          I&apos;m suddenly experiencing…
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Describe what started now (chest pain, breathlessness, weakness…). AI
          estimates criticality using your words plus your live record — then
          tells you what to do next.
        </p>
      </section>

      <AiDisclaimer />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What are you feeling right now?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="symptom">Symptoms</Label>
          <Textarea
            id="symptom"
            rows={4}
            value={symptom}
            onChange={(e) => setSymptom(e.target.value)}
            placeholder="Example: Sudden heartache and pressure in my chest for 10 minutes, a bit short of breath…"
          />
          <div className="flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setSymptom(q)}
                className="rounded-full border border-border px-2.5 py-1 text-xs hover:bg-muted"
              >
                {q}
              </button>
            ))}
          </div>
          <Button
            className="w-full"
            onClick={() => {
              if (!symptom.trim()) {
                toast.error("Describe your symptoms first");
                return;
              }
              setSubmitted(symptom.trim());
              toast.success("Criticality assessed from your symptoms");
            }}
          >
            Assess criticality
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <Card
          className={cn(
            result.is_emergency && "border-rose-300 bg-rose-50/40",
          )}
        >
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="font-display text-xl">{result.title}</CardTitle>
              <Badge className={cn("capitalize", riskClass(result.criticality))}>
                {result.criticality} · {result.criticality_score}/100
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>{result.summary}</p>
            <p className="text-xs text-muted-foreground">{result.context_note}</p>

            {result.matched_red_flags.length ? (
              <div>
                <p className="mb-1 font-medium">Matched warning signals</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {result.matched_red_flags.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div>
              <p className="mb-1 font-medium">What to do next</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {result.next_actions.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3">
              <p className="mb-1 inline-flex items-center gap-1.5 font-medium">
                <PhoneCall className="h-4 w-4" />
                Call 108 if any of these
              </p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                {result.when_to_call_108.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-2">
              {result.is_emergency ? (
                <a
                  href="tel:108"
                  className={cn(buttonVariants({ variant: "destructive" }))}
                >
                  <AlertTriangle className="mr-1.5 h-4 w-4" />
                  Call 108
                </a>
              ) : null}
              <Link
                to="/patient/appointments"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Request doctor appointment
              </Link>
              <Link
                to="/patient/check-in"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Log vitals now
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

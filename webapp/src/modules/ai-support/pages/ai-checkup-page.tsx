import { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Activity,
  FlaskConical,
  PhoneCall,
  Share2,
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
import {
  runEmergencyTriageAsync,
  type EmergencyTriageResult,
} from "@/modules/ai-support/emergency-triage";
import { isAiServiceConfigured } from "@/services/ai.service";

const QUICK = [
  "Sudden chest pain / heartache",
  "Shortness of breath",
  "Hands shivering / trembling",
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
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<EmergencyTriageResult | null>(null);

  if (!user?.id) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Sign in as a patient for emergency AI checkup.
      </p>
    );
  }

  const assess = async () => {
    if (!symptom.trim()) {
      toast.error("Describe your symptoms first");
      return;
    }
    setBusy(true);
    try {
      const out = await runEmergencyTriageAsync(user.id, symptom.trim());
      setResult(out);
      toast.success(
        out.provider.includes("openrouter")
          ? "Assessed via AI API (OpenRouter)"
          : "Assessed with live clinical engine",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Assessment failed");
    } finally {
      setBusy(false);
    }
  };

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
          Describe what started now. The AI API estimates criticality, then your
          live record fills risk scores, early warnings, missing tests, and
          referral guidance.
        </p>
        <p className="mt-3 text-[11px] text-white/60">
          {isAiServiceConfigured()
            ? "AI service connected · OpenRouter when keys are set on ai-service"
            : "Set VITE_AI_API_BASE_URL to your ai-service for OpenRouter triage"}
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
            placeholder="Example: Hands shivering for 20 minutes, feeling weak…"
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
          <Button className="w-full" disabled={busy} onClick={() => void assess()}>
            {busy ? "Asking AI…" : "Assess criticality"}
          </Button>
        </CardContent>
      </Card>

      {result ? (
        <>
          <Card
            className={cn(
              result.is_emergency && "border-rose-300 bg-rose-50/40",
            )}
          >
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="font-display text-xl">
                  {result.title}
                </CardTitle>
                <Badge
                  className={cn("capitalize", riskClass(result.criticality))}
                >
                  {result.criticality} · {result.criticality_score}/100
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {result.provider}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>{result.summary}</p>
              <p className="text-xs text-muted-foreground">
                {result.context_note}
              </p>

              {result.matched_red_flags.length ? (
                <div>
                  <p className="mb-1 font-medium">Warning signals</p>
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
            </CardContent>
          </Card>

          {/* Expected outcomes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-4 w-4 text-primary" />
                Risk scoring
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">
                AI-assisted disease risk from your live vitals & conditions —
                diabetes, hypertension, CKD, cardiovascular, stroke.
              </p>
              {result.disease_risks.map((d) => (
                <div key={d.key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{d.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {d.score} · {d.band}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        d.band === "critical" || d.band === "high"
                          ? "bg-rose-500"
                          : "bg-teal-600",
                      )}
                      style={{
                        width: `${Math.min(100, Math.max(d.score, 3))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                Early warning
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.early_warnings.length ? (
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-amber-950">
                  {result.early_warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No high-risk complication warnings from current live data.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FlaskConical className="h-4 w-4 text-primary" />
                Clinical guidance · missing investigations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.missing_investigations.length ? (
                result.missing_investigations.map((m) => (
                  <div
                    key={m.test_name}
                    className="rounded-xl border border-border px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{m.test_name}</p>
                      <Badge variant="outline" className="capitalize">
                        {m.priority}
                      </Badge>
                    </div>
                    <p className="mt-1 text-muted-foreground">{m.reason}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {m.evidence_basis}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No major guideline gaps vs your conditions and ordered labs.
                </p>
              )}
              <Link
                to="/patient/investigations"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                Open Reports
              </Link>
            </CardContent>
          </Card>

          <Card
            className={cn(
              result.referral.recommended && "border-rose-200 bg-rose-50/30",
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="h-4 w-4" />
                Referral protocol
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Badge className="capitalize">{result.referral.urgency}</Badge>
              <p className="font-medium">{result.referral.specialty}</p>
              <p className="text-muted-foreground">{result.referral.message}</p>
              {result.referral.reasons?.length ? (
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {result.referral.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              ) : null}
              <Link
                to="/patient/appointments"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Request referral / appointment
              </Link>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">{result.disclaimer}</p>
        </>
      ) : null}
    </div>
  );
}

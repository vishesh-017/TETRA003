import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Bot,
  FlaskConical,
  RefreshCw,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { subscribeStore } from "@/data/store";
import { cn } from "@/lib/utils";
import { runAiCheckup } from "@/modules/ai-support/checkup-engine";
import {
  listCheckups,
  runAndPersistCheckup,
} from "@/modules/ai-support/repository";
import type { AiCheckupResult } from "@/modules/ai-support/types";

function riskClass(level: string) {
  if (level === "critical") return "bg-red-100 text-red-700";
  if (level === "high") return "bg-orange-100 text-orange-700";
  if (level === "moderate") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-700";
}

export function AiCheckupPage() {
  const { user } = useAuth();
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => subscribeStore(() => setTick((t) => t + 1)), []);

  const display = useMemo(() => {
    if (!user?.id) return null;
    return runAiCheckup(user.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, tick]) as AiCheckupResult | null;

  const history = useMemo(() => {
    if (!display) return [];
    return listCheckups(display.patient_id).slice(0, 5);
  }, [display, tick]);

  const run = () => {
    if (!user?.id) return;
    setBusy(true);
    try {
      runAndPersistCheckup(user.id);
      toast.success("Checkup saved from your live vitals & record");
      setTick((t) => t + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkup failed");
    } finally {
      setBusy(false);
    }
  };

  if (!display) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Sign in as a patient to run AI Checkup on what you are experiencing now.
      </p>
    );
  }

  const criticality =
    Math.max(
      0,
      ...display.disease_scores.map((d) => d.score),
      display.readmission_probability_percent,
      100 - display.recovery_score,
    ) ||
    (display.overall_risk === "critical"
      ? 90
      : display.overall_risk === "high"
        ? 75
        : display.overall_risk === "moderate"
          ? 50
          : 25);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F3D4C] via-[#0F766E] to-[#134E4A] p-6 text-white sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          <FlaskConical className="h-3.5 w-3.5" />
          AI Checkup · live
        </p>
        <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          What you are experiencing now
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Reads your latest vitals, symptoms, conditions, and medicines to report
          current abnormalities and criticality — then guides next steps.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Badge className={cn("capitalize", riskClass(display.overall_risk))}>
            Criticality {display.overall_risk}
          </Badge>
          <Badge className="bg-white/15 text-white">
            Score ~{Math.round(criticality)}/100
          </Badge>
          <Badge className="bg-white/15 text-white">
            Recovery {display.recovery_score}
          </Badge>
          <Button
            size="sm"
            className="bg-white text-teal-900 hover:bg-white/90"
            disabled={busy}
            onClick={run}
          >
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", busy && "animate-spin")} />
            Refresh from live data
          </Button>
        </div>
      </section>

      <AiDisclaimer />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <Activity className="h-5 w-5 text-primary" />
            Current findings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>{display.summary}</p>
          <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
            {display.warning_signs.slice(0, 8).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>
              {display.demographics.age != null
                ? `${display.demographics.age} yrs`
                : "Age n/a"}
            </span>
            <span>·</span>
            <span>{display.demographics.sex || "Sex n/a"}</span>
            <span>·</span>
            <span>{display.demographics.diagnosis}</span>
          </div>
          {display.latest_vitals.recorded_at ? (
            <p className="text-xs text-muted-foreground">
              Latest vitals {new Date(display.latest_vitals.recorded_at).toLocaleString()}
              : BP {display.latest_vitals.bp}, sugar{" "}
              {display.latest_vitals.sugar || "—"}
            </p>
          ) : (
            <Link
              to="/patient/check-in"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Complete check-in first
            </Link>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Disease criticality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {display.disease_scores.map((d) => (
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
                      "h-full rounded-full transition-all",
                      d.band === "critical" || d.band === "high"
                        ? "bg-rose-500"
                        : "bg-teal-600",
                    )}
                    style={{ width: `${Math.min(100, Math.max(d.score, 3))}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card
          className={cn(
            display.referral.recommended && "border-rose-200 bg-rose-50/40",
          )}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              What to do next
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Badge className="capitalize">{display.referral.urgency}</Badge>
            <p>{display.referral.message}</p>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              {display.next_actions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                to="/patient/appointments"
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Request appointment
              </Link>
              <Link
                to="/patient/ai-assistant"
                className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
              >
                <Bot className="mr-1 h-3.5 w-3.5" />
                Ask AI
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {display.data_completeness.missing_fields.length ? (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="flex gap-3 p-4 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Incomplete data: {display.data_completeness.missing_fields.join(", ")}.
              Scores update as soon as you check in.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <p className="text-xs text-muted-foreground">{display.disclaimer}</p>

      {history.length ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saved checkups</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
              >
                <span>{new Date(h.assessed_at).toLocaleString()}</span>
                <Badge className={cn("capitalize", riskClass(h.overall_risk))}>
                  {h.overall_risk}
                </Badge>
                <span className="text-muted-foreground">
                  Recovery {h.recovery_score}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

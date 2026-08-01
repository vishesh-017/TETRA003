import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  FlaskConical,
  Share2,
  Stethoscope,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getStore } from "@/data/store";
import type { HealthIntelligenceBundle } from "@/lib/health-engine";
import { cn } from "@/lib/utils";
import { listCheckups } from "@/modules/ai-support/repository";
import { summarizePatientRoutine } from "@/modules/ai-support/routine-summary";
import { RiskBadge } from "@/modules/doctor/components/risk-badge";
import type { PatientDetail } from "@/modules/doctor/types";

function ageLine(data: PatientDetail) {
  const parts = [
    data.age ? `${data.age} yrs` : null,
    data.sex || null,
    (data.chronic_diseases || []).slice(0, 2).join(" with ") || null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function PatientRecordOverview({
  data,
  health,
  onRefer,
}: {
  data: PatientDetail;
  health: HealthIntelligenceBundle | null;
  onRefer?: () => void;
}) {
  const store = getStore();
  const timeline = store.healthRecords
    .filter((r) => r.patient_id === data.id)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
    .slice(0, 8);

  const alerts = store.alerts
    .filter((a) => a.patient_id === data.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 4);
  const latestCheckup = listCheckups(data.id)[0];
  const routine = summarizePatientRoutine(data.id);

  const discharge = store.discharges.find((d) => d.patient_id === data.id);
  const doctor = store.doctors.find((d) => d.id === discharge?.doctor_id);
  const doctorName = doctor
    ? store.profiles.find((p) => p.id === doctor.user_id)?.full_name
    : null;

  const insight =
    health?.alerts?.clinician_message ||
    health?.readmission?.explanation?.[0] ||
    health?.readmission?.summary ||
    `${data.full_name.split(" ")[0]}'s latest signals are organized below. AI surfaces patterns — you decide next steps.`;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B2E36] via-[#0F4C5C] to-[#0F766E] p-6 text-white sm:p-8">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
          <Stethoscope className="h-3.5 w-3.5" />
          Patient record
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {data.full_name}
          </h2>
          <RiskBadge level={data.risk_level} />
        </div>
        <p className="mt-2 max-w-2xl text-sm text-white/80">{ageLine(data)}</p>
        <p className="mt-1 text-xs text-white/60">
          {[
            discharge?.created_at
              ? `Discharged ${new Date(discharge.created_at).toLocaleDateString()}`
              : null,
            doctorName ? `Dr. ${doctorName.replace(/^Dr\.\s*/i, "")}` : null,
            typeof data.address === "object" && data.address
              ? String(
                  (data.address as { city?: string }).city ||
                    (data.address as { district?: string }).district ||
                    "",
                ) || null
              : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Active on panel"}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {onRefer ? (
            <Button
              variant="outline"
              size="sm"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={onRefer}
            >
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              Refer patient
            </Button>
          ) : null}
          <Link
            to="/doctor/patients"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-white/30 bg-white/10 text-white hover:bg-white/20",
            )}
          >
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to queue
          </Link>
        </div>
      </section>

      <Card className="border-primary/15 bg-gradient-to-br from-sky-50/80 to-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="h-4 w-4 text-primary" />
            {routine.headline}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {routine.paragraphs.map((p) => (
            <p key={p.slice(0, 40)} className="text-muted-foreground">
              {p}
            </p>
          ))}
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
            {routine.bullets.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground">
            Dynamic AI summary · {new Date(routine.generated_at).toLocaleString()}{" "}
            · assistive only
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-4 w-4 text-primary" />
              Care spine timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {timeline.length === 0 && alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Timeline builds as check-ins, investigations, and notes are
                recorded.
              </p>
            ) : null}
            {alerts.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-border bg-card p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{a.title}</p>
                  <Badge variant="outline" className="capitalize">
                    {a.status}
                  </Badge>
                  <Badge variant="secondary" className="capitalize">
                    {a.severity}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {timeline.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.title}</p>
                      <Badge variant="outline" className="uppercase text-[10px]">
                        {item.category.replaceAll("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.summary}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {new Date(item.recorded_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="overflow-hidden border-0 bg-[#0F172A] text-white shadow-lg">
            <CardContent className="space-y-3 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/50">
                    AI clinical support
                  </p>
                  <p className="font-display text-xl font-semibold">Risk panel</p>
                </div>
                <RiskBadge level={data.risk_level} />
              </div>
              <p className="text-sm leading-relaxed text-white/80">{insight}</p>
              <div className="flex flex-wrap gap-2 text-xs text-white/60">
                <span>Recovery {data.recovery_score ?? "—"}</span>
                <span>·</span>
                <span>
                  Readmit{" "}
                  {health?.readmission.readmission_probability_percent.toFixed(
                    0,
                  ) ?? "—"}
                  %
                </span>
                <span>·</span>
                <span className="capitalize">
                  {health?.progression.overall_worsening_risk ?? "—"} progression
                </span>
              </div>
            </CardContent>
          </Card>

          {latestCheckup ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latest AI Checkup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-2">
                  <RiskBadge level={latestCheckup.overall_risk} />
                  <Badge variant="outline">
                    Recovery {latestCheckup.recovery_score}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {latestCheckup.summary.slice(0, 220)}
                  {latestCheckup.summary.length > 220 ? "…" : ""}
                </p>
                {latestCheckup.missing_tests.length ? (
                  <p className="text-xs text-muted-foreground">
                    Missing labs flagged:{" "}
                    {latestCheckup.missing_tests.join(", ")}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {new Date(latestCheckup.assessed_at).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="h-4 w-4 text-primary" />
                Disease scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(health?.progression.assessments || []).map((a) => (
                <div
                  key={a.condition}
                  className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <span className="capitalize">
                    {a.condition.replaceAll("_", " ")}
                  </span>
                  <Badge variant="outline" className="capitalize">
                    {a.risk}
                  </Badge>
                </div>
              ))}
              {!health?.progression.assessments?.length ? (
                <p className="text-sm text-muted-foreground">
                  Scores appear after vitals sync.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

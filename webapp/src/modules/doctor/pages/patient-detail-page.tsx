import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { CarePlanReview } from "@/modules/doctor/components/care-plan-review";
import { DischargeForm } from "@/modules/doctor/components/discharge-form";
import { RiskBadge } from "@/modules/doctor/components/risk-badge";
import {
  useDoctorAppointments,
  useDoctorMutations,
  useDoctorPatient,
  usePatientCarePlans,
  usePatientCheckins,
  usePatientDischarges,
  usePatientMedicines,
} from "@/modules/doctor/hooks";
import type { DischargeFormSchema } from "@/modules/doctor/schemas";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "history", label: "Medical History" },
  { id: "medicines", label: "Medicines" },
  { id: "appointments", label: "Appointments" },
  { id: "checkins", label: "Check-ins" },
  { id: "ai", label: "AI Summary" },
  { id: "risk", label: "Risk Status" },
  { id: "passport", label: "Passport" },
  { id: "discharge", label: "Discharge & Care Companion" },
];

export function PatientDetailPage() {
  const { patientId } = useParams();
  const [tab, setTab] = useState("overview");
  const patient = useDoctorPatient(patientId);
  const discharges = usePatientDischarges(patientId);
  const carePlans = usePatientCarePlans(patientId);
  const checkins = usePatientCheckins(patientId);
  const medicines = usePatientMedicines(patientId);
  const appointments = useDoctorAppointments({ patient_id: patientId });
  const mutations = useDoctorMutations();

  const latestDraft = useMemo(
    () => (discharges.data || []).find((item) => item.status === "draft"),
    [discharges.data],
  );
  const latestFinal = useMemo(
    () => (discharges.data || []).find((item) => item.status === "finalized"),
    [discharges.data],
  );
  const activeCarePlan = useMemo(
    () =>
      (carePlans.data || []).find((item) => item.status === "ai_draft") ||
      (carePlans.data || [])[0],
    [carePlans.data],
  );

  if (patient.isLoading) return <LoadingScreen fullScreen={false} />;
  if (patient.isError || !patient.data) {
    return (
      <ErrorState
        title="Patient not found"
        description={patient.error?.message || "Unable to load patient"}
        onRetry={() => void patient.refetch()}
      />
    );
  }

  const data = patient.data;

  const saveDischarge = (values: DischargeFormSchema) => {
    if (!patientId) return;
    mutations.saveDischarge.mutate({
      patientId,
      dischargeId: latestDraft?.id,
      body: { ...values, source: "manual" },
    });
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/doctor/patients" className="text-sm text-primary">
            ← Back to patients
          </Link>
          <h1 className="mt-2 font-display text-3xl font-semibold">{data.full_name}</h1>
          <p className="text-sm text-muted-foreground">
            {data.age ? `${data.age} yrs · ` : ""}
            {data.sex || "—"} · {data.blood_group || "Blood group n/a"} ·{" "}
            {data.phone || "No phone"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={data.risk_level} />
          <Badge variant="outline">Recovery {data.recovery_score ?? "—"}</Badge>
          <Badge variant="secondary">{data.status}</Badge>
        </div>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "overview" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard title="ABHA (Demo)" value={data.abha_id_demo || "—"} />
          <InfoCard title="Adherence" value={`${data.adherence_percent ?? 100}%`} />
          <InfoCard title="Missed medicines" value={data.missed_medicines} />
          <InfoCard title="Missed check-ins" value={data.missed_checkins} />
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Chronic diseases</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {(data.chronic_diseases || []).length ? (
                data.chronic_diseases?.map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">None listed</p>
              )}
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Care team contacts</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <ContactBlock title="Emergency" contact={data.emergency_contact} />
              <ContactBlock title="Caregiver" contact={data.caregiver_info} />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "history" ? (
        <Card>
          <CardHeader>
            <CardTitle>Medical history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap text-muted-foreground">
              {data.medical_history || "No medical history recorded."}
            </p>
            <div>
              <p className="font-medium">Allergies</p>
              <p className="text-muted-foreground">
                {(data.allergies || []).join(", ") || "None recorded"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "medicines" ? (
        <Card>
          <CardHeader>
            <CardTitle>Current medicines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(medicines.data || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active medicine schedule. Finalize a discharge to generate a Care Companion draft.
              </p>
            ) : (
              medicines.data?.map((med) => (
                <div key={med.id} className="rounded-xl border border-border p-3">
                  <p className="font-medium">{med.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[med.dose, med.frequency].filter(Boolean).join(" · ")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "appointments" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Appointments</CardTitle>
            <Link
              to="/doctor/appointments"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Manage
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {(appointments.data || []).map((appt) => (
              <div key={appt.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium capitalize">{appt.status}</p>
                <p className="text-muted-foreground">
                  {new Date(appt.scheduled_at).toLocaleString()} · {appt.location}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {tab === "checkins" ? (
        <Card>
          <CardHeader>
            <CardTitle>Daily check-ins</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(checkins.data || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No check-ins yet.</p>
            ) : (
              checkins.data?.map((item) => (
                <div key={item.id} className="rounded-xl border border-border p-3 text-sm">
                  <p className="font-medium">
                    {new Date(item.recorded_at).toLocaleString()}
                  </p>
                  <p className="text-muted-foreground">
                    Pain {item.pain_score ?? "—"} · Sugar{" "}
                    {String((item.vitals as { sugar?: number } | null)?.sugar ?? "—")} · BP{" "}
                    {String(
                      (item.vitals as { bp_systolic?: number } | null)?.bp_systolic ?? "—",
                    )}
                  </p>
                  {item.notes ? <p className="mt-1">{item.notes}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "ai" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>AI Patient Summary</CardTitle>
            <Button
              size="sm"
              variant="outline"
              disabled={mutations.refreshAiSummary.isPending}
              onClick={() => patientId && mutations.refreshAiSummary.mutate(patientId)}
            >
              Refresh summary
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <AiDisclaimer />
            <p className="rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">
              {data.ai_summary ||
                "No summary yet. Finalize a discharge or refresh to generate an informational Care Companion summary."}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {tab === "risk" ? (
        <div className="grid gap-4 md:grid-cols-3">
          <InfoCard title="Readmission risk" value={data.risk_level || "unknown"} />
          <InfoCard title="Disease progression" value={data.disease_progression || "stable"} />
          <InfoCard title="Recovery Score" value={data.recovery_score ?? "—"} />
        </div>
      ) : null}

      {tab === "passport" ? (
        <Card>
          <CardHeader>
            <CardTitle>Patient Passport preview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 text-sm">
            <InfoCard
              title="QR token"
              value={String(data.passport?.qr_token || "Not generated")}
            />
            <InfoCard
              title="ABHA ID (Demo)"
              value={String(data.passport?.abha_id_demo || data.abha_id_demo || "—")}
            />
            <div className="rounded-xl border border-border p-4 md:col-span-2">
              <p className="font-medium">Emergency contacts</p>
              <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                {JSON.stringify(
                  data.passport?.emergency_contacts || data.emergency_contact,
                  null,
                  2,
                )}
              </pre>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {tab === "discharge" ? (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Discharge summary{" "}
                {latestDraft ? (
                  <Badge variant="warning">Draft</Badge>
                ) : latestFinal ? (
                  <Badge variant="secondary">Finalized</Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DischargeForm
                initial={latestDraft || latestFinal}
                saving={mutations.saveDischarge.isPending}
                finalizing={mutations.finalizeDischarge.isPending}
                onSaveDraft={saveDischarge}
                onFinalize={
                  latestDraft
                    ? () =>
                        patientId &&
                        mutations.finalizeDischarge.mutate({
                          dischargeId: latestDraft.id,
                          patientId,
                        })
                    : undefined
                }
              />
            </CardContent>
          </Card>

          {activeCarePlan ? (
            <CarePlanReview
              carePlan={activeCarePlan}
              approving={mutations.approveCarePlan.isPending}
              onApprove={(notes) =>
                patientId &&
                mutations.approveCarePlan.mutate({
                  carePlanId: activeCarePlan.id,
                  patientId,
                  body: { doctor_review_notes: notes },
                })
              }
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function InfoCard({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="mt-1 font-medium capitalize">{value}</p>
      </CardContent>
    </Card>
  );
}

function ContactBlock({
  title,
  contact,
}: {
  title: string;
  contact?: { name?: string; phone?: string; relationship?: string } | null;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">
        {contact?.name || "—"} · {contact?.phone || "—"} · {contact?.relationship || "—"}
      </p>
    </div>
  );
}

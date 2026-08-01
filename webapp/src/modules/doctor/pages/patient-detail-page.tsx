import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { getStore, IDS, subscribeStore } from "@/data/store";
import { InvestigationPicker } from "@/modules/investigations/components/investigation-picker";
import { PendingInvestigationsPanel } from "@/modules/investigations/components/pending-investigations";
import { investigationRepository } from "@/modules/investigations/repository";
import type { InvestigationDraftInput } from "@/modules/investigations/types";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import {
  AlertBanner,
  InsightsPanel,
  RecoveryCard,
  RiskCard,
  TrendCard,
} from "@/components/health-engine";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { evaluateHealth } from "@/lib/health-engine";
import { cn } from "@/lib/utils";
import { EmergencyCard } from "@/modules/identity/components/emergency-card";
import { MedicalTimeline } from "@/modules/identity/components/medical-timeline";
import {
  PassportDetailGrid,
  PassportWallet,
} from "@/modules/identity/components/passport-wallet";
import {
  useDigitalPassport,
  useMedicalTimeline,
} from "@/modules/identity/hooks";
import { usePatientInvestigations } from "@/modules/investigations/hooks";
import { buildObservationsForPatient } from "@/modules/prediction/adapters";
import { CarePlanReview } from "@/modules/doctor/components/care-plan-review";
import { DischargeForm } from "@/modules/doctor/components/discharge-form";
import { PatientRecordOverview } from "@/modules/doctor/components/patient-record-overview";
import { RiskBadge } from "@/modules/doctor/components/risk-badge";
import { AddInvestigationForm } from "@/modules/investigations/components/add-investigation-form";
import { MedicinesEditor } from "@/modules/medicines/medicines-editor";
import { RecoveryTimeline } from "@/modules/doctor/intelligence/components/recovery-timeline";
import { useAiPatientSummary } from "@/modules/doctor/intelligence/hooks";
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
  { id: "timeline", label: "Recovery Timeline" },
  { id: "trends", label: "Trend Graphs" },
  { id: "ai", label: "AI Summary" },
  { id: "risk", label: "Risk Status" },
  { id: "passport", label: "Passport" },
  { id: "caregiver", label: "Caregiver" },
  { id: "notes", label: "Doctor Notes" },
  { id: "discharge", label: "Discharge & Care Companion" },
];

export function PatientDetailPage() {
  const { patientId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "overview");
  const aiIntel = useAiPatientSummary(patientId);
  const patient = useDoctorPatient(patientId);
  const discharges = usePatientDischarges(patientId);
  const carePlans = usePatientCarePlans(patientId);
  const checkins = usePatientCheckins(patientId);
  const medicines = usePatientMedicines(patientId);
  const appointments = useDoctorAppointments({ patient_id: patientId });
  const investigations = usePatientInvestigations(patientId);
  const digitalPassport = useDigitalPassport(patientId);
  const timeline = useMedicalTimeline(patientId);
  const mutations = useDoctorMutations();
  const [investigationDrafts, setInvestigationDrafts] = useState<
    InvestigationDraftInput[]
  >([]);
  const [storeTick, setStoreTick] = useState(0);
  const [noteDraft, setNoteDraft] = useState("");
  const [historyDraft, setHistoryDraft] = useState("");

  useEffect(() => subscribeStore(() => setStoreTick((t) => t + 1)), []);

  useEffect(() => {
    const fromUrl = searchParams.get("tab");
    if (fromUrl && fromUrl !== tab) setTab(fromUrl);
  }, [searchParams, tab]);

  useEffect(() => {
    if (!patientId) return;
    const dischargeId =
      getStore().discharges.find(
        (d) => d.patient_id === patientId && d.status === "draft",
      )?.id ||
      getStore().discharges.find((d) => d.patient_id === patientId)?.id;
    const rows = investigationRepository
      .listForPatient(patientId)
      .filter((i) => !dischargeId || i.discharge_id === dischargeId || !i.discharge_id)
      .filter((i) => i.status !== "cancelled" && i.status !== "completed");
    setInvestigationDrafts(
      rows.map((r) => ({
        name: r.name,
        purpose: r.purpose,
        due_date: r.due_date,
        priority: r.priority,
        notes: r.notes,
        preparation: r.preparation,
      })),
    );
  }, [patientId, discharges.data, investigations.data]);

  const changeTab = (next: string) => {
    setTab(next);
    setSearchParams({ tab: next }, { replace: true });
  };

  const latestDraft = useMemo(
    () => (discharges.data || []).find((item) => item.status === "draft"),
    [discharges.data],
  );
  const latestFinal = useMemo(
    () => (discharges.data || []).find((item) => item.status === "finalized"),
    [discharges.data],
  );
  const reviewCarePlan = useMemo(() => {
    const list = carePlans.data || [];
    return (
      list.find((item) => item.status === "generating") ||
      list.find((item) => item.status === "ai_draft") ||
      list.find((item) => item.status === "active") ||
      list[0]
    );
  }, [carePlans.data]);

  const health = useMemo(
    () =>
      patientId ? evaluateHealth(buildObservationsForPatient(patientId)) : null,
    // Recompute when underlying store-backed lists refresh
    [patientId, checkins.data, medicines.data, investigations.data, storeTick],
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
    const doctorId =
      getStore().doctors.find((d) => d.id === IDS.doctor)?.id || IDS.doctor;
    mutations.saveDischarge.mutate(
      {
        patientId,
        dischargeId: latestDraft?.id,
        body: { ...values, source: "manual" },
      },
      {
        onSuccess: (discharge) => {
          investigationRepository.replaceForDischarge(
            patientId,
            doctorId,
            discharge.id,
            investigationDrafts,
          );
        },
      },
    );
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
          <Badge variant="outline">
            Recovery {data.recovery_score != null ? data.recovery_score : "NA"}
          </Badge>
          <Badge variant="secondary">{data.status}</Badge>
        </div>
      </div>

      <Tabs tabs={TABS} value={tab} onChange={changeTab} />

      {tab === "overview" ? (
        <div className="space-y-5">
          <PatientRecordOverview data={data} health={health} />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <InfoCard title="ABHA (Live)" value={data.abha_id_demo || "—"} />
            <InfoCard
              title="Adherence"
              value={`${data.adherence_percent ?? 100}%`}
            />
            <InfoCard title="Missed medicines" value={data.missed_medicines} />
            <InfoCard title="Missed check-ins" value={data.missed_checkins} />
          </div>
          {patientId ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <AddInvestigationForm
                patientId={patientId}
                requestedBy="doctor"
              />
              <PendingInvestigationsPanel
                patientId={patientId}
                mode="doctor"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "history" ? (
        <Card>
          <CardHeader>
            <CardTitle>Medical history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="whitespace-pre-wrap text-muted-foreground">
              {data.medical_history?.trim() || "NA — no medical history yet."}
            </p>
            <div>
              <p className="font-medium">Allergies</p>
              <p className="text-muted-foreground">
                {(data.allergies || []).length
                  ? (data.allergies || []).join(", ")
                  : "NA"}
              </p>
            </div>
            <div className="space-y-2 border-t border-border pt-3">
              <p className="font-medium">Add history entry</p>
              <textarea
                className="flex min-h-[88px] w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
                value={historyDraft}
                onChange={(e) => setHistoryDraft(e.target.value)}
                placeholder="e.g. Prior hospitalization for uncontrolled diabetes (2024)"
              />
              <Button
                size="sm"
                disabled={
                  !historyDraft.trim() || mutations.addMedicalHistory.isPending
                }
                onClick={() => {
                  if (!patientId || !historyDraft.trim()) return;
                  mutations.addMedicalHistory.mutate(
                    { patientId, body: historyDraft },
                    { onSuccess: () => setHistoryDraft("") },
                  );
                }}
              >
                Save with date &amp; time
              </Button>
            </div>
            {patientId ? (
              <div className="space-y-2">
                <p className="font-medium">Timeline history updates</p>
                {getStore()
                  .healthRecords.filter(
                    (r) =>
                      r.patient_id === patientId &&
                      r.category === "chronic_disease",
                  )
                  .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
                  .slice(0, 12)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-border px-3 py-2"
                    >
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.recorded_at).toLocaleString()}
                      </p>
                      <p className="mt-0.5">{r.summary}</p>
                    </div>
                  ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {tab === "medicines" ? (
        <div className="space-y-4">
          {patientId ? (
            <MedicinesEditor patientId={patientId} actor="doctor" />
          ) : null}
        </div>
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

      {tab === "timeline" && patientId ? (
        <Card>
          <CardHeader>
            <CardTitle>Recovery Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <RecoveryTimeline patientId={patientId} />
          </CardContent>
        </Card>
      ) : null}

      {tab === "trends" && health ? (
        <TrendCard trends={health.trends} />
      ) : null}

      {tab === "ai" ? (
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>AI Patient Summary</CardTitle>
              <Button
                size="sm"
                variant="outline"
                disabled={mutations.refreshAiSummary.isPending}
                onClick={() =>
                  patientId && mutations.refreshAiSummary.mutate(patientId)
                }
              >
                Refresh summary
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <AiDisclaimer />
              {aiIntel.data ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoCard
                    title="Current condition"
                    value={aiIntel.data.current_condition}
                  />
                  <InfoCard
                    title="Recovery trend"
                    value={aiIntel.data.recovery_trend}
                  />
                  <InfoCard
                    title="Medicine adherence"
                    value={aiIntel.data.medicine_adherence}
                  />
                  <InfoCard
                    title="Recommended attention"
                    value={aiIntel.data.attention_level.replaceAll("_", " ")}
                  />
                  <div className="rounded-xl border border-border p-4 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">
                      Latest symptoms
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {aiIntel.data.latest_symptoms.length
                        ? aiIntel.data.latest_symptoms.join(", ")
                        : "None reported"}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {aiIntel.data.narrative}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {aiIntel.data.disclaimer}
                    </p>
                  </div>
                </div>
              ) : null}
              <p className="rounded-xl bg-muted/60 p-4 text-sm leading-relaxed">
                {data.ai_summary ||
                  "No stored Care Companion summary yet. Finalize a discharge or refresh."}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === "caregiver" ? (
        <Card>
          <CardHeader>
            <CardTitle>Caregiver information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <InfoCard
              title="Name"
              value={data.caregiver_info?.name || "—"}
            />
            <InfoCard
              title="Phone"
              value={data.caregiver_info?.phone || "—"}
            />
            <InfoCard
              title="Relationship"
              value={data.caregiver_info?.relationship || "—"}
            />
            <InfoCard
              title="Emergency contact"
              value={
                data.emergency_contact
                  ? `${data.emergency_contact.name || ""} · ${data.emergency_contact.phone || ""}`
                  : "—"
              }
            />
          </CardContent>
        </Card>
      ) : null}

      {tab === "notes" ? (
        <Card>
          <CardHeader>
            <CardTitle>Doctor notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-2 rounded-2xl border border-primary/20 bg-primary/5 p-3">
              <p className="font-medium">Add note</p>
              <textarea
                className="flex min-h-[96px] w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Clinical observation, counseling, follow-up plan…"
              />
              <Button
                size="sm"
                disabled={!noteDraft.trim() || mutations.addDoctorNote.isPending}
                onClick={() => {
                  if (!patientId || !noteDraft.trim()) return;
                  mutations.addDoctorNote.mutate(
                    { patientId, body: noteDraft },
                    { onSuccess: () => setNoteDraft("") },
                  );
                }}
              >
                Save note with date &amp; time
              </Button>
            </div>

            {patientId
              ? getStore()
                  .healthRecords.filter(
                    (r) =>
                      r.patient_id === patientId &&
                      r.category === "doctor_note",
                  )
                  .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
                  .map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-border p-3"
                    >
                      <p className="font-medium">{r.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(r.recorded_at).toLocaleString()}
                      </p>
                      <p className="mt-1 text-muted-foreground">{r.summary}</p>
                    </div>
                  ))
              : null}

            {(discharges.data || []).map((d) => (
              <div key={d.id} className="rounded-xl border border-border p-3">
                <p className="font-medium capitalize">{d.status} discharge</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {d.updated_at
                    ? new Date(d.updated_at).toLocaleString()
                    : d.created_at
                      ? new Date(d.created_at).toLocaleString()
                      : "NA"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {d.doctor_notes || "NA — no clinician notes on this discharge."}
                </p>
                {d.special_instructions ? (
                  <p className="mt-2">{d.special_instructions}</p>
                ) : null}
              </div>
            ))}
            {(carePlans.data || []).map((c) => (
              <div key={c.id} className="rounded-xl border border-border p-3">
                <p className="font-medium">Care plan review notes</p>
                <p className="mt-1 text-muted-foreground">
                  {c.doctor_review_notes ||
                    c.caregiver_instructions ||
                    "NA — no review notes yet."}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {tab === "risk" ? (
        health ? (
          <div className="space-y-4">
            <AlertBanner alert={health.alerts} />
            <RecoveryCard recovery={health.recovery} />
            <RiskCard
              readmission={health.readmission}
              progression={health.progression.assessments}
            />
            <InsightsPanel
              explain={health.explain}
              recovery={health.recovery}
            />
            <p className="text-xs text-muted-foreground">
              In-app Health Intelligence Engine — assistive CDS only. Stored risk
              band: {data.risk_level || "unknown"} · progression:{" "}
              {data.disease_progression || "stable"}.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard title="Readmission risk" value={data.risk_level || "unknown"} />
            <InfoCard
              title="Disease progression"
              value={data.disease_progression || "stable"}
            />
            <InfoCard title="Recovery Score" value={data.recovery_score ?? "—"} />
          </div>
        )
      ) : null}

      {tab === "passport" ? (
        digitalPassport.data ? (
          <div className="space-y-4">
            <PassportWallet passport={digitalPassport.data} />
            <EmergencyCard passport={digitalPassport.data} />
            <PassportDetailGrid passport={digitalPassport.data} />
            <MedicalTimeline events={timeline.data || []} />
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No digital passport is available for this patient yet.
            </CardContent>
          </Card>
        )
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
            <CardContent className="space-y-6">
              <DischargeForm
                initial={latestDraft || latestFinal}
                saving={mutations.saveDischarge.isPending}
                finalizing={mutations.finalizeDischarge.isPending}
                onSaveDraft={saveDischarge}
                onFinalize={
                  latestDraft
                    ? () => {
                        if (!patientId) return;
                        const doctorId =
                          getStore().doctors.find((d) => d.id === IDS.doctor)
                            ?.id || IDS.doctor;
                        investigationRepository.replaceForDischarge(
                          patientId,
                          doctorId,
                          latestDraft.id,
                          investigationDrafts,
                        );
                        mutations.finalizeDischarge.mutate({
                          dischargeId: latestDraft.id,
                          patientId,
                        });
                      }
                    : undefined
                }
              />
              <InvestigationPicker
                value={investigationDrafts}
                onChange={setInvestigationDrafts}
                disabled={(latestDraft || latestFinal)?.status === "finalized"}
              />
            </CardContent>
          </Card>

          {patientId ? (
            <PendingInvestigationsPanel
              patientId={patientId}
              title="Investigation compliance"
              mode="doctor"
            />
          ) : null}

          {mutations.finalizeDischarge.isPending || reviewCarePlan ? (
            <div className="space-y-3">
              <h2 className="font-display text-xl font-semibold">
                AI Care Companion Review
              </h2>
              {mutations.finalizeDischarge.isPending ||
              reviewCarePlan?.status === "generating" ? (
                <CarePlanReview
                  carePlan={
                    reviewCarePlan?.status === "generating"
                      ? reviewCarePlan
                      : {
                          id: "generating",
                          patient_id: patientId || "",
                          doctor_id: "",
                          status: "generating",
                          version: 0,
                          warning_signs: [],
                          next_steps: [],
                          daily_schedule: null,
                          source_discharge: null,
                          medicines: [],
                          daily_tasks: [],
                          disclaimer:
                            "AI Care Companion assists only. It never diagnoses, never prescribes, and never replaces doctors.",
                        }
                  }
                  generating
                  onApprove={() => undefined}
                  onReject={() => undefined}
                />
              ) : reviewCarePlan ? (
                <CarePlanReview
                  carePlan={reviewCarePlan}
                  approving={mutations.approveCarePlan.isPending}
                  rejecting={mutations.rejectCarePlan.isPending}
                  saving={mutations.updateCarePlanDraft.isPending}
                  onApprove={(body) =>
                    patientId &&
                    mutations.approveCarePlan.mutate({
                      carePlanId: reviewCarePlan.id,
                      patientId,
                      body,
                    })
                  }
                  onReject={(notes) =>
                    patientId &&
                    mutations.rejectCarePlan.mutate({
                      carePlanId: reviewCarePlan.id,
                      patientId,
                      body: { doctor_review_notes: notes },
                    })
                  }
                  onSaveDraft={(body) =>
                    patientId &&
                    mutations.updateCarePlanDraft.mutate({
                      carePlanId: reviewCarePlan.id,
                      patientId,
                      body,
                    })
                  }
                />
              ) : null}
            </div>
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


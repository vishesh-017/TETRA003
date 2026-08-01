import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getStore, newId, updateStore } from "@/data/store";
import {
  useDoctorAppointments,
  useDoctorMutations,
  useDoctorPatients,
} from "@/modules/doctor/hooks";
import {
  appointmentFormSchema,
  type AppointmentFormSchema,
} from "@/modules/doctor/schemas";
import type { AppointmentItem } from "@/modules/doctor/types";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "missed", label: "Missed" },
  { id: "cancelled", label: "Cancelled" },
];

function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AppointmentsPage() {
  const [tab, setTab] = useState("upcoming");
  const [editing, setEditing] = useState<AppointmentItem | null>(null);
  const [postVisitFor, setPostVisitFor] = useState<AppointmentItem | null>(null);
  const [rx, setRx] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const appointments = useDoctorAppointments();
  const patients = useDoctorPatients({});
  const mutations = useDoctorMutations();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AppointmentFormSchema>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patient_id: "",
      scheduled_at: "",
      location: "",
      notes: "",
      appointment_type: "follow_up",
    },
  });

  const filtered = useMemo(() => {
    const rows = appointments.data || [];
    if (tab === "upcoming") {
      return rows.filter(
        (item) => item.status === "scheduled" || item.status === "approved",
      );
    }
    return rows.filter((item) => item.status === tab);
  }, [appointments.data, tab]);

  if (appointments.isLoading) return <LoadingScreen fullScreen={false} />;
  if (appointments.isError) {
    return (
      <ErrorState
        title="Unable to load appointments"
        description={appointments.error.message}
        onRetry={() => void appointments.refetch()}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        eyebrow="Follow-ups"
        title="Appointments"
        description="Schedule, approve, reschedule, complete visits, and file post-visit notes."
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {editing ? "Reschedule appointment" : "Schedule appointment"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={handleSubmit((values) => {
              const body = {
                patient_id: values.patient_id,
                scheduled_at: new Date(values.scheduled_at).toISOString(),
                location: values.location,
                notes: values.notes,
                appointment_type: values.appointment_type,
              };
              if (editing) {
                mutations.updateAppointment.mutate(
                  {
                    id: editing.id,
                    body: {
                      scheduled_at: body.scheduled_at,
                      location: body.location,
                      notes: body.notes,
                      status: "scheduled",
                    },
                  },
                  {
                    onSuccess: () => {
                      setEditing(null);
                      reset();
                    },
                  },
                );
              } else {
                mutations.createAppointment.mutate(body, {
                  onSuccess: () => reset(),
                });
              }
            })}
          >
            <div className="space-y-2">
              <Label>Patient</Label>
              <Select {...register("patient_id")} disabled={Boolean(editing)}>
                <option value="">Select patient</option>
                {(patients.data || []).map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.full_name}
                  </option>
                ))}
              </Select>
              {errors.patient_id ? (
                <p className="text-xs text-destructive">
                  {errors.patient_id.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Date & time</Label>
              <Input type="datetime-local" {...register("scheduled_at")} />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input {...register("location")} />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select {...register("appointment_type")}>
                <option value="follow_up">Follow-up</option>
                <option value="review">Review</option>
                <option value="emergency">Urgent review</option>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Textarea {...register("notes")} />
            </div>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit">
                {editing ? "Save reschedule" : "Schedule"}
              </Button>
              {editing ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    reset();
                  }}
                >
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {postVisitFor ? (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>
              Post-appointment form · {postVisitFor.patient_name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>New prescription / medicines</Label>
              <Textarea
                value={rx}
                onChange={(e) => setRx(e.target.value)}
                placeholder="Metformin 500mg BID after food&#10;Amlodipine 5mg OD morning"
                rows={4}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Visit notes for patient</Label>
              <Textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const now = new Date().toISOString();
                  const store = getStore();
                  const patient = store.patients.find(
                    (p) => p.id === postVisitFor.patient_id,
                  );
                  updateStore((draft) => {
                    const appt = draft.appointments.find(
                      (a) => a.id === postVisitFor.id,
                    );
                    if (appt) {
                      appt.status = "completed";
                      appt.notes = [
                        appt.notes,
                        visitNotes ? `Visit notes: ${visitNotes}` : null,
                        rx ? `Rx: ${rx}` : null,
                      ]
                        .filter(Boolean)
                        .join("\n");
                    }
                    // Reflect medicines into patient list when lines look like "Name Dose"
                    for (const line of rx.split("\n").map((l) => l.trim()).filter(Boolean)) {
                      const [name, ...rest] = line.split(/\s+/);
                      if (!name) continue;
                      draft.medicines.unshift({
                        id: newId(),
                        patient_id: postVisitFor.patient_id,
                        care_plan_id: null,
                        name,
                        dose: rest.join(" ") || null,
                        frequency: "As directed",
                        time_slots: ["08:00"],
                        instructions: "Prescribed after clinic visit",
                        active: true,
                      });
                    }
                    if (patient) {
                      draft.notifications.unshift({
                        id: newId(),
                        user_id: patient.user_id,
                        type: "appointment",
                        title: "Visit completed — new care updates",
                        body:
                          visitNotes ||
                          "Your doctor completed the appointment and updated your plan.",
                        read: false,
                        created_at: now,
                      });
                      if (rx.trim()) {
                        draft.notifications.unshift({
                          id: newId(),
                          user_id: patient.user_id,
                          type: "medicine",
                          title: "New medicines prescribed",
                          body: rx.trim().slice(0, 160),
                          read: false,
                          created_at: now,
                        });
                      }
                    }
                  });
                  mutations.updateAppointment.mutate({
                    id: postVisitFor.id,
                    body: { status: "completed" },
                  });
                  setPostVisitFor(null);
                  setRx("");
                  setVisitNotes("");
                }}
              >
                Save & complete
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPostVisitFor(null);
                  setRx("");
                  setVisitNotes("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <EmptyState
            title={
              tab === "upcoming"
                ? "No appointments scheduled yet"
                : `No ${tab} appointments`
            }
            description="Schedule a follow-up above to keep recovery on track."
          />
        ) : (
          filtered.map((appt) => (
            <Card key={appt.id}>
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{appt.patient_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(appt.scheduled_at).toLocaleString()} ·{" "}
                    {appt.location || "No location"}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {appt.appointment_type.replaceAll("_", " ")} · {appt.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {appt.status === "scheduled" || appt.status === "approved" ? (
                    <>
                      {appt.status === "scheduled" ? (
                        <Button
                          size="sm"
                          onClick={() =>
                            mutations.updateAppointment.mutate({
                              id: appt.id,
                              body: {
                                status: "approved",
                                notes: `${appt.notes || ""}\n[Approved by clinician]`.trim(),
                              },
                            })
                          }
                        >
                          Approve
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" disabled>
                          Approved
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(appt);
                          reset({
                            patient_id: appt.patient_id,
                            scheduled_at: toLocalInput(appt.scheduled_at),
                            location: appt.location || "",
                            notes: appt.notes || "",
                            appointment_type: appt.appointment_type,
                          });
                        }}
                      >
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => {
                          setPostVisitFor(appt);
                          setRx("");
                          setVisitNotes("");
                        }}
                      >
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          mutations.cancelAppointment.mutate(appt.id)
                        }
                      >
                        Cancel
                      </Button>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

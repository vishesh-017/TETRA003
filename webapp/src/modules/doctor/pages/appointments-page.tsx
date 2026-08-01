import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  { id: "scheduled", label: "Upcoming" },
  { id: "completed", label: "Completed" },
  { id: "missed", label: "Missed" },
  { id: "cancelled", label: "Cancelled" },
];

export function AppointmentsPage() {
  const [tab, setTab] = useState("scheduled");
  const [editing, setEditing] = useState<AppointmentItem | null>(null);
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

  const filtered = useMemo(
    () => (appointments.data || []).filter((item) => item.status === tab),
    [appointments.data, tab],
  );

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
      <div>
        <h1 className="font-display text-3xl font-semibold">Follow-up Scheduling</h1>
        <p className="text-sm text-muted-foreground">
          Schedule, reschedule, and cancel appointments. Track upcoming, completed, and missed visits.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editing ? "Reschedule appointment" : "Schedule appointment"}</CardTitle>
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
                mutations.createAppointment.mutate(body, { onSuccess: () => reset() });
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
                <p className="text-xs text-destructive">{errors.patient_id.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Date & time</Label>
              <Input type="datetime-local" {...register("scheduled_at")} />
              {errors.scheduled_at ? (
                <p className="text-xs text-destructive">{errors.scheduled_at.message}</p>
              ) : null}
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

      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No {tab} appointments.
            </CardContent>
          </Card>
        ) : (
          filtered.map((appt) => (
            <Card key={appt.id}>
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-medium">{appt.patient_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(appt.scheduled_at).toLocaleString()} · {appt.location || "No location"}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {appt.appointment_type.replaceAll("_", " ")} · {appt.status}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {appt.status === "scheduled" ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(appt);
                          reset({
                            patient_id: appt.patient_id,
                            scheduled_at: appt.scheduled_at.slice(0, 16),
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
                        variant="secondary"
                        onClick={() =>
                          mutations.updateAppointment.mutate({
                            id: appt.id,
                            body: { status: "completed" },
                          })
                        }
                      >
                        Mark completed
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => mutations.cancelAppointment.mutate(appt.id)}
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

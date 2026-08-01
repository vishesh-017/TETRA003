import { format } from "date-fns";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/auth-context";
import {
  usePatientAppointments,
  usePatientMutations,
} from "@/modules/patient/hooks";
import type { AppointmentView } from "@/modules/patient/types";
import { listDoctorsForPatient } from "@/modules/reports/repository";

function group(items: AppointmentView[]) {
  return {
    upcoming: items.filter(
      (a) => a.status === "scheduled" || a.status === "approved",
    ),
    requests: items.filter(
      (a) =>
        a.status === "reschedule_requested" || a.status === "cancel_requested",
    ),
    completed: items.filter((a) => a.status === "completed"),
    missed: items.filter(
      (a) => a.status === "missed" || a.status === "cancelled",
    ),
  };
}

export function AppointmentsPage() {
  const { user } = useAuth();
  const query = usePatientAppointments();
  const { appointmentAction, requestAppointment } = usePatientMutations();
  const doctors = useMemo(
    () => (user?.id ? listDoctorsForPatient(user.id) : []),
    [user?.id, query.dataUpdatedAt],
  );
  const [doctorId, setDoctorId] = useState("");
  const [when, setWhen] = useState("");
  const [location, setLocation] = useState("Clinic OPD");
  const [reason, setReason] = useState("");

  if (query.isLoading)
    return <LoadingScreen label="Loading appointments…" fullScreen={false} />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        description="Could not load appointments."
        onRetry={() => query.refetch()}
      />
    );

  const groups = group(query.data);
  const selectedDoctor = doctorId || doctors[0]?.id || "";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Appointments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Book a visit, or request reschedule / cancel on existing ones.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Request appointment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Doctor</Label>
            <Select
              value={selectedDoctor}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              {doctors.length === 0 ? (
                <option value="">No linked doctor</option>
              ) : (
                doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.specialty ? ` · ${d.specialty}` : ""}
                  </option>
                ))
              )}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date & time</Label>
            <Input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Follow-up / worsening symptoms / lab review"
            />
          </div>
          <Button
            disabled={
              requestAppointment.isPending || !when || !selectedDoctor
            }
            onClick={() => {
              requestAppointment.mutate(
                {
                  doctorId: selectedDoctor,
                  scheduledAt: when,
                  location,
                  reason,
                },
                {
                  onSuccess: () => {
                    setReason("");
                    setWhen("");
                  },
                  onError: (e) =>
                    toast.error(
                      e instanceof Error ? e.message : "Could not book",
                    ),
                },
              );
            }}
          >
            {requestAppointment.isPending ? "Booking…" : "Book appointment"}
          </Button>
        </CardContent>
      </Card>

      <Section
        title="Upcoming"
        items={groups.upcoming}
        action={appointmentAction}
      />
      <Section title="Pending requests" items={groups.requests} />
      <Section title="Completed" items={groups.completed} />
      <Section title="Missed / Cancelled" items={groups.missed} />
    </div>
  );
}

function Section({
  title,
  items,
  action,
}: {
  title: string;
  items: AppointmentView[];
  action?: ReturnType<typeof usePatientMutations>["appointmentAction"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">None</p>
        ) : (
          items.map((appt) => (
            <div
              key={appt.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-soft"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{appt.doctor_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(appt.scheduled_at), "PPp")} ·{" "}
                    {appt.location}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {appt.status.replaceAll("_", " ")}
                </Badge>
              </div>
              {action && appt.status === "scheduled" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={action.isPending}
                    onClick={() =>
                      action.mutate({
                        appointmentId: appt.id,
                        action: "reschedule",
                      })
                    }
                  >
                    Reschedule
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={action.isPending}
                    onClick={() =>
                      action.mutate({
                        appointmentId: appt.id,
                        action: "cancel",
                      })
                    }
                  >
                    Cancel
                  </Button>
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

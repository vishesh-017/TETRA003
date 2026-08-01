import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import {
  usePatientAppointments,
  usePatientMutations,
} from "@/modules/patient/hooks";
import type { AppointmentView } from "@/modules/patient/types";

function group(items: AppointmentView[]) {
  return {
    upcoming: items.filter((a) => a.status === "scheduled"),
    requests: items.filter(
      (a) =>
        a.status === "reschedule_requested" || a.status === "cancel_requested",
    ),
    completed: items.filter((a) => a.status === "completed"),
    missed: items.filter((a) => a.status === "missed" || a.status === "cancelled"),
  };
}

export function AppointmentsPage() {
  const query = usePatientAppointments();
  const { appointmentAction } = usePatientMutations();

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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Appointments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Countdown, reminders, and reschedule / cancel requests.
        </p>
      </div>

      <Section title="Upcoming" items={groups.upcoming} action={appointmentAction} />
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
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{appt.doctor_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(appt.scheduled_at), "EEE, d MMM yyyy · h:mm a")}
                  </p>
                  {appt.location ? (
                    <p className="text-xs text-muted-foreground">{appt.location}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="capitalize">
                    {appt.status.replaceAll("_", " ")}
                  </Badge>
                  {appt.days_left != null ? (
                    <p className="mt-2 text-sm font-semibold text-primary">
                      {appt.days_left === 0
                        ? "Today"
                        : `${appt.days_left} day${appt.days_left === 1 ? "" : "s"} left`}
                    </p>
                  ) : null}
                </div>
              </div>
              {appt.status === "scheduled" && action ? (
                <div className="mt-3 flex gap-2">
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
                    Reschedule request
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
                    Cancel request
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

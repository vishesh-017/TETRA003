import { CalendarDays, HeartPulse } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { ErrorState } from "@/components/feedback/error-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/modules/patient/components/progress-ring";
import { PassportPreview } from "@/modules/patient/components/passport-preview";
import { QuickActions } from "@/modules/patient/components/quick-actions";
import { TaskRow } from "@/modules/patient/components/task-row";
import {
  usePatientMutations,
  usePatientPassport,
  useTodayDashboard,
} from "@/modules/patient/hooks";

function greetingPrefix() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export function PatientHomePage() {
  const dash = useTodayDashboard();
  const passport = usePatientPassport();
  const { setTaskStatus } = usePatientMutations();

  if (dash.isLoading)
    return <LoadingScreen label="Loading your recovery journey…" fullScreen={false} />;
  if (dash.isError || !dash.data)
    return (
      <ErrorState
        description="Could not load today's plan."
        onRetry={() => dash.refetch()}
      />
    );

  const data = dash.data;
  const focusTasks = data.tasks.slice(0, 5);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-10">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-6 shadow-soft"
      >
        <p className="text-sm text-muted-foreground">Today's Recovery Journey</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {greetingPrefix()}, {data.greeting_name}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Complete today's tasks, take medicines on time, and keep your recovery moving.
        </p>

        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Today's Recovery Progress</span>
            <span className="tabular-nums text-primary">{data.progress_percent}%</span>
          </div>
          <ProgressBar value={data.progress_percent} />
        </div>
      </motion.section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Today's Tasks</CardTitle>
            <Link
              to="/patient/care-plan"
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              Full care plan
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {focusTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                busy={setTaskStatus.isPending}
                onComplete={() =>
                  setTaskStatus.mutate({ taskId: task.id, status: "completed" })
                }
                onSkip={() =>
                  setTaskStatus.mutate({ taskId: task.id, status: "skipped" })
                }
              />
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarDays className="h-4 w-4 text-primary" />
                Next Appointment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.next_appointment ? (
                <>
                  <p className="font-display text-3xl font-semibold text-primary">
                    {data.days_until_appointment === 0
                      ? "Today"
                      : `${data.days_until_appointment} Day${data.days_until_appointment === 1 ? "" : "s"} Left`}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {data.next_appointment.doctor_name}
                    {data.next_appointment.location
                      ? ` · ${data.next_appointment.location}`
                      : ""}
                  </p>
                  <Link
                    to="/patient/appointments"
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4")}
                  >
                    View appointments
                  </Link>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid grid-cols-2 gap-4 p-6">
              <div>
                <p className="text-xs text-muted-foreground">Recovery Score</p>
                <p className="mt-1 flex items-center gap-1 font-display text-2xl font-semibold">
                  <HeartPulse className="h-4 w-4 text-secondary" />
                  {data.recovery_score}
                  <span className="text-sm font-normal text-muted-foreground">/ 100</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Readmission Risk</p>
                <Badge
                  className="mt-2 capitalize"
                  variant={
                    data.risk_level === "low"
                      ? "secondary"
                      : data.risk_level === "moderate"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {data.risk_level}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold">Quick Actions</h2>
        <QuickActions />
      </section>

      {passport.data ? <PassportPreview passport={passport.data} /> : null}
    </div>
  );
}

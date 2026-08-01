import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CalendarCheck2,
  CalendarX2,
  HeartPulse,
  Pill,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RiskBadge } from "@/modules/doctor/components/risk-badge";
import { StatCard } from "@/modules/doctor/components/stat-card";
import {
  useDoctorAppointments,
  useDoctorDashboard,
} from "@/modules/doctor/hooks";

export function DashboardPage() {
  const dashboard = useDoctorDashboard();
  const appointments = useDoctorAppointments({ status: "scheduled" });

  if (dashboard.isLoading) return <LoadingScreen fullScreen={false} />;
  if (dashboard.isError || !dashboard.data) {
    return (
      <ErrorState
        title="Unable to load doctor dashboard"
        description={dashboard.error?.message || "Please try again."}
        onRetry={() => void dashboard.refetch()}
      />
    );
  }

  const data = dashboard.data;
  const todayAppts = (appointments.data || []).filter((item) =>
    item.scheduled_at.startsWith(new Date().toISOString().slice(0, 10)),
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Doctor Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor recovery, follow-ups, and high-risk patients. AI Care Companion assists — you decide.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/doctor/patients"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Manage patients
          </Link>
          <Link to="/doctor/high-risk" className={cn(buttonVariants())}>
            High risk
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total patients" value={data.total_patients} icon={Users} />
        <StatCard
          title="Active patients"
          value={data.active_patients}
          icon={HeartPulse}
          accent="secondary"
        />
        <StatCard
          title="High-risk patients"
          value={data.high_risk_patients}
          icon={AlertTriangle}
          accent="danger"
        />
        <StatCard
          title="Medicine adherence"
          value={`${data.medicine_adherence_percent}%`}
          icon={Pill}
          accent="secondary"
        />
        <StatCard
          title="Follow-ups due today"
          value={data.followups_due_today}
          icon={CalendarCheck2}
        />
        <StatCard
          title="Missed follow-ups"
          value={data.missed_followups}
          icon={CalendarX2}
          accent="warning"
        />
        <StatCard
          title="Today's appointments"
          value={data.todays_appointments}
          icon={Activity}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent alerts</CardTitle>
            <Badge variant="outline">{data.recent_alerts.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recent_alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent alerts.</p>
            ) : (
              data.recent_alerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-xl border border-border p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{alert.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.patient_name || "Patient"} · {alert.body}
                      </p>
                    </div>
                    <RiskBadge level={alert.severity} />
                  </div>
                  <Link
                    className="mt-2 inline-block text-sm text-primary"
                    to={`/doctor/patients/${alert.patient_id}`}
                  >
                    Open patient
                  </Link>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today&apos;s appointments</CardTitle>
            <Link to="/doctor/appointments" className="text-sm text-primary">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayAppts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No appointments scheduled for today.
              </p>
            ) : (
              todayAppts.map((appt) => (
                <div key={appt.id} className="rounded-xl border border-border p-3">
                  <p className="font-medium">{appt.patient_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(appt.scheduled_at).toLocaleString()} · {appt.location}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

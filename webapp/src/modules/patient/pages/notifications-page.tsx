import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  FlaskConical,
  HeartPulse,
  MessageSquare,
  Pill,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import {
  usePatientMutations,
  usePatientNotifications,
} from "@/modules/patient/hooks";
import type { NotificationType } from "@/modules/patient/types";

const ICONS: Record<NotificationType, typeof Bell> = {
  medicine: Pill,
  appointment: CalendarDays,
  doctor_message: MessageSquare,
  emergency: AlertTriangle,
  health_tip: HeartPulse,
  investigation: FlaskConical,
};

export function NotificationsPage() {
  const query = usePatientNotifications();
  const { markNotificationRead, markAllRead } = usePatientMutations();

  if (query.isLoading)
    return <LoadingScreen label="Loading notifications…" fullScreen={false} />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        description="Could not load notifications."
        onRetry={() => query.refetch()}
      />
    );

  const unread = query.data.filter((n) => !n.read).length;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {unread} unread · medicine, appointments, doctor messages, tips
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={!unread || markAllRead.isPending}
          onClick={() => markAllRead.mutate()}
        >
          Mark all read
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-4 w-4" />
            Inbox
            {unread ? <Badge>{unread}</Badge> : null}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {query.data.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  if (!n.read) markNotificationRead.mutate(n.id);
                }}
                className={`flex w-full gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                  n.read
                    ? "border-border/60 bg-card"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.read ? <Badge variant="secondary">New</Badge> : null}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

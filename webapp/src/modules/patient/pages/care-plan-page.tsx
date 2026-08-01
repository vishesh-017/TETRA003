import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskRow } from "@/modules/patient/components/task-row";
import {
  useCarePlanTimeline,
  usePatientMutations,
  useTodayDashboard,
} from "@/modules/patient/hooks";
import { ProgressBar } from "@/modules/patient/components/progress-ring";

export function CarePlanPage() {
  const timeline = useCarePlanTimeline();
  const dash = useTodayDashboard();
  const { setTaskStatus } = usePatientMutations();

  if (timeline.isLoading) return <LoadingScreen label="Loading care plan…" />;
  if (timeline.isError || !timeline.data)
    return (
      <ErrorState
        description="Could not load today's care plan."
        onRetry={() => timeline.refetch()}
      />
    );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Today's Care Plan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organized by your AI Care Companion from the doctor's discharge summary.
        </p>
      </div>
      <AiDisclaimer />

      {dash.data ? (
        <Card>
          <CardContent className="space-y-2 p-5">
            <div className="flex justify-between text-sm">
              <span>Day progress</span>
              <span className="font-medium text-primary">
                {dash.data.progress_percent}%
              </span>
            </div>
            <ProgressBar value={dash.data.progress_percent} />
          </CardContent>
        </Card>
      ) : null}

      {timeline.data.map((block) => (
        <Card key={block.period}>
          <CardHeader>
            <CardTitle>{block.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {block.tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tasks in this period.</p>
            ) : (
              block.tasks.map((task) => (
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
              ))
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { motion } from "framer-motion";
import {
  AlertTriangle,
  Coffee,
  Moon,
  Sparkles,
  Sun,
  Sunset,
} from "lucide-react";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskRow } from "@/modules/patient/components/task-row";
import {
  useActiveCarePlan,
  useCarePlanTimeline,
  usePatientMutations,
  useTodayDashboard,
} from "@/modules/patient/hooks";
import { ProgressBar } from "@/modules/patient/components/progress-ring";
import type { Period } from "@/modules/patient/types";

const PERIOD_META: Record<
  Period,
  { icon: typeof Sun; accent: string }
> = {
  morning: { icon: Sun, accent: "text-amber-600" },
  afternoon: { icon: Sunset, accent: "text-orange-600" },
  evening: { icon: Coffee, accent: "text-indigo-600" },
  night: { icon: Moon, accent: "text-slate-600" },
};

export function CarePlanPage() {
  const timeline = useCarePlanTimeline();
  const dash = useTodayDashboard();
  const activePlan = useActiveCarePlan();
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
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          Today&apos;s Recovery Journey
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          Your AI Care Companion plan
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Organized from your doctor&apos;s approved discharge summary — never a
          new diagnosis or prescription.
        </p>
        {activePlan.data ? (
          <Badge variant="outline" className="mt-3">
            Plan v{activePlan.data.version}
          </Badge>
        ) : null}
      </motion.div>
      <AiDisclaimer />

      {activePlan.data?.patient_summary ? (
        <Card className="border-primary/15 bg-gradient-to-br from-primary/5 to-card">
          <CardContent className="space-y-2 p-5 text-sm text-muted-foreground">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
              Simple explanation
            </p>
            <p>{activePlan.data.patient_summary}</p>
          </CardContent>
        </Card>
      ) : null}

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

      {timeline.data.map((block, index) => {
        const meta = PERIOD_META[block.period];
        const Icon = meta.icon;
        return (
          <motion.div
            key={block.period}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${meta.accent}`} />
                  {block.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {block.tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No tasks in this period.
                  </p>
                ) : (
                  block.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      busy={setTaskStatus.isPending}
                      onComplete={() =>
                        setTaskStatus.mutate({
                          taskId: task.id,
                          status: "completed",
                        })
                      }
                      onSkip={() =>
                        setTaskStatus.mutate({
                          taskId: task.id,
                          status: "skipped",
                        })
                      }
                    />
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {activePlan.data?.warning_signs?.length ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              Warning signs to watch
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              {activePlan.data.warning_signs.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

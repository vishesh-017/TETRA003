import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/modules/patient/components/progress-ring";
import { usePatientRecovery } from "@/modules/patient/hooks";

export function RecoveryPage() {
  const query = usePatientRecovery();

  if (query.isLoading)
    return <LoadingScreen label="Loading recovery score…" fullScreen={false} />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        description="Could not load recovery score."
        onRetry={() => query.refetch()}
      />
    );

  const data = query.data;
  const chart = [
    { factor: "Medicines", value: data.factors.medicine_adherence },
    { factor: "Check-ins", value: data.factors.daily_checkins },
    { factor: "Tasks", value: data.factors.task_completion },
    { factor: "Sleep", value: data.factors.sleep },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Recovery Score</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Updates as you complete tasks, medicines, and check-ins.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Current score</p>
            <p className="font-display text-5xl font-semibold text-primary">
              {data.score}
              <span className="text-lg text-muted-foreground"> / 100</span>
            </p>
            <Badge className="mt-2 capitalize" variant="secondary">
              Readmission risk: {data.risk_level}
            </Badge>
          </div>
          <div className="w-full max-w-xs space-y-2">
            <ProgressBar value={data.score} />
            <Link
              to="/patient/lifestyle-simulator"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Open Lifestyle Simulator
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Factor breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chart}>
              <PolarGrid />
              <PolarAngleAxis dataKey="factor" />
              <Radar
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

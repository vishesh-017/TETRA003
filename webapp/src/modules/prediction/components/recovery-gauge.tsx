import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecoveryLevel } from "@/modules/prediction/types";

const LEVEL_VARIANT: Record<
  RecoveryLevel,
  "secondary" | "default" | "warning" | "destructive" | "outline"
> = {
  excellent: "secondary",
  good: "default",
  moderate: "outline",
  needs_attention: "warning",
  critical: "destructive",
};

export function RecoveryGauge({
  score,
  level,
  summary,
}: {
  score: number;
  level: RecoveryLevel;
  summary: string;
}) {
  const pct = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-card to-secondary/10">
      <CardHeader>
        <CardTitle>Recovery Score</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative h-36 w-36">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ type: "spring", stiffness: 80, damping: 18 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-semibold">{pct.toFixed(0)}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
        </div>
        <div className="max-w-sm space-y-2 text-center sm:text-left">
          <Badge variant={LEVEL_VARIANT[level]} className="capitalize">
            {level.replaceAll("_", " ")}
          </Badge>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>
      </CardContent>
    </Card>
  );
}

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ConditionProgression,
  ReadmissionRiskResult,
} from "@/lib/health-engine";

export function RiskCard({
  readmission,
  progression,
}: {
  readmission?: ReadmissionRiskResult | null;
  progression?: ConditionProgression[] | null;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Readmission Risk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {readmission ? (
              <>
                <p className="font-display text-3xl font-semibold text-primary">
                  {readmission.readmission_probability_percent.toFixed(0)}%
                </p>
                <Badge className="capitalize">{readmission.risk_category}</Badge>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {readmission.explanation.slice(0, 3).map((e) => (
                    <li key={e}>• {e}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No risk data</p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-lg">Disease Progression</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(progression || []).length ? (
              progression!.map((a) => (
                <div
                  key={a.condition}
                  className="rounded-xl border border-border p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium capitalize">
                      {a.condition.replaceAll("_", " ")}
                    </p>
                    <Badge variant="outline" className="capitalize">
                      {a.risk}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{a.reason}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Confidence {(a.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No progression data</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

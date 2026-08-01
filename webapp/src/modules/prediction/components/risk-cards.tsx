import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AlertDecisionResponse,
  ConditionProgression,
  ReadmissionRiskResponse,
} from "@/modules/prediction/types";

export function RiskCards({
  readmission,
  progression,
  alert,
}: {
  readmission?: ReadmissionRiskResponse;
  progression?: ConditionProgression[];
  alert?: AlertDecisionResponse;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
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
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Disease Progression</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(progression || []).length ? (
            progression!.map((a) => (
              <div key={a.condition} className="rounded-xl border border-border p-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium capitalize">
                    {a.condition.replaceAll("_", " ")}
                  </p>
                  <Badge variant="outline" className="capitalize">
                    {a.risk}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{a.reason}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Care Alert</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alert ? (
            <>
              <p className="font-medium">{alert.title}</p>
              <Badge className="capitalize">
                {alert.action.replaceAll("_", " ")}
              </Badge>
              <p className="text-xs text-muted-foreground">{alert.patient_message}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

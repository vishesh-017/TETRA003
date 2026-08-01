import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { RiskBadge } from "@/modules/doctor/components/risk-badge";
import { useHighRiskPatients } from "@/modules/doctor/hooks";

export function HighRiskPage() {
  const [sortBy, setSortBy] = useState("recovery_score");
  const [minRisk, setMinRisk] = useState<string>("");
  const query = useHighRiskPatients(sortBy, minRisk || undefined);

  if (query.isLoading) return <LoadingScreen fullScreen={false} />;
  if (query.isError) {
    return (
      <ErrorState
        title="Unable to load high-risk list"
        description={query.error.message}
        onRetry={() => void query.refetch()}
      />
    );
  }

  const rows = query.data || [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        eyebrow="Clinical focus"
        title="High Risk"
        description="Patients sorted by recovery, readmission risk, progression, and adherence gaps."
      />

      <AiDisclaimer />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-2">
          <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="recovery_score">Sort by Recovery Score</option>
            <option value="readmission_risk">Sort by Readmission Risk</option>
            <option value="missed_medicines">Sort by Missed Medicines</option>
            <option value="missed_checkins">Sort by Missed Check-ins</option>
          </Select>
          <Select value={minRisk} onChange={(event) => setMinRisk(event.target.value)}>
            <option value="">All patients</option>
            <option value="high">High / critical focus</option>
          </Select>
        </CardContent>
      </Card>

      {!rows.length ? (
        <EmptyState
          icon={ShieldCheck}
          title="No high-risk patients"
          description="Your cohort looks stable right now. Keep monitoring from the Intelligence Center."
          action={
            <Link to="/doctor" className={cn(buttonVariants())}>
              Open Intelligence Center
            </Link>
          }
        />
      ) : null}

      <div className="grid gap-3">
        {rows.map((row) => (
          <Card key={row.patient_id}>
            <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-xl">{row.full_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{row.phone || "No phone"}</p>
              </div>
              <RiskBadge level={row.readmission_risk} />
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-5">
                <Metric label="Recovery" value={row.recovery_score ?? "—"} />
                <Metric label="Progression" value={row.disease_progression || "—"} />
                <Metric label="Missed meds" value={row.missed_medicines} />
                <Metric label="Missed check-ins" value={row.missed_checkins} />
                <Metric label="Escalation" value={row.escalation_status} />
              </div>
              <Link
                to={`/doctor/patients/${row.patient_id}`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Open profile
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-muted/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium capitalize">{value}</p>
    </div>
  );
}

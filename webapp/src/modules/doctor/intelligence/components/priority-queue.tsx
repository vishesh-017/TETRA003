import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { RiskBadge } from "@/modules/doctor/components/risk-badge";
import type {
  PriorityPatientCard,
  SuggestedAction,
} from "@/modules/doctor/intelligence/types";
import { cn } from "@/lib/utils";

const ACTION_LABEL: Record<SuggestedAction, string> = {
  monitor: "Monitor",
  schedule_followup: "Schedule follow-up",
  immediate_review: "Immediate review",
};

export function PriorityQueue({
  patients,
}: {
  patients: PriorityPatientCard[];
}) {
  if (!patients.length) {
    return (
      <EmptyState
        icon={Sparkles}
        title="Queue is clear"
        description="No patients match the current filters. Adjust filters or review the full patient list."
        action={
          <Link to="/doctor/patients" className={cn(buttonVariants())}>
            View all patients
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {patients.map((p, i) => (
        <motion.article
          key={p.patient_id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.35) }}
          className="rounded-3xl border border-border/80 bg-card/80 p-4 shadow-soft backdrop-blur sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-display text-xl font-semibold">
                  {p.full_name}
                </h3>
                <RiskBadge level={p.risk_badge} />
                <Badge variant="outline" className="capitalize">
                  {ACTION_LABEL[p.suggested_action]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {p.age != null ? `${p.age} yrs · ` : ""}
                {p.conditions.join(", ") || "No conditions listed"}
              </p>
            </div>
            <Link
              to={`/doctor/patients/${p.patient_id}?tab=risk`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Open
            </Link>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Recovery"
              value={`${p.recovery_score.toFixed(0)} · ${p.recovery_level.replaceAll("_", " ")}`}
            />
            <Metric label="Readmission" value={p.readmission_risk} capitalize />
            <Metric
              label="Progression"
              value={p.disease_progression}
              capitalize
            />
            <Metric label="Adherence" value={`${p.medicine_adherence}%`} />
            <Metric
              label="Last check-in"
              value={
                p.last_checkin_at
                  ? formatDistanceToNow(new Date(p.last_checkin_at), {
                      addSuffix: true,
                    })
                  : "None"
              }
            />
            <Metric
              label="Next appointment"
              value={
                p.next_appointment_at
                  ? new Date(p.next_appointment_at).toLocaleString()
                  : "None"
              }
            />
            <Metric label="Health worker" value={p.health_worker || "—"} />
            <Metric label="Caregiver" value={p.caregiver || "—"} />
          </div>

          <p className="mt-3 rounded-2xl bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {p.insight}
          </p>
        </motion.article>
      ))}
    </div>
  );
}

function Metric({
  label,
  value,
  capitalize,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm font-medium", capitalize && "capitalize")}>
        {value}
      </p>
    </div>
  );
}

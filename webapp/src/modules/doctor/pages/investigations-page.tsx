import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  useDoctorInvestigations,
  useInvestigationMutations,
  useInvestigationStats,
} from "@/modules/investigations/hooks";
import type { InvestigationQueueFilter } from "@/modules/investigations/types";

const FILTERS: Array<{ id: InvestigationQueueFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "overdue", label: "Overdue" },
  { id: "high_priority", label: "High Priority" },
  { id: "review_required", label: "Review Required" },
  { id: "completed", label: "Completed" },
];

export function InvestigationsPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<InvestigationQueueFilter>("all");
  const queue = useDoctorInvestigations(filter);
  const stats = useInvestigationStats();
  const { review } = useInvestigationMutations();

  const s = stats.data;

  const headerStats = useMemo(
    () => [
      { label: "Compliance", value: `${s?.compliance_rate ?? 0}%` },
      { label: "Completed", value: s?.completed ?? 0 },
      { label: "Pending", value: s?.pending ?? 0 },
      { label: "Overdue", value: s?.overdue ?? 0 },
    ],
    [s],
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="inline-flex items-center gap-2 text-sm font-medium text-sky-800">
          <FlaskConical className="h-4 w-4" />
          Investigation Compliance
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Investigation Queue
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Track prescribed diagnostics after discharge — pending, overdue, and
          ready for review.
        </p>
      </motion.div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {headerStats.map((card) => (
          <Card key={card.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                {card.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f.id}
            size="sm"
            variant={filter === f.id ? "default" : "outline"}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Queue{" "}
            <Badge variant="outline" className="ml-2">
              {queue.data?.length ?? 0}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading queue…</p>
          ) : !queue.data?.length ? (
            <p className="text-sm text-muted-foreground">
              No investigations in this filter.
            </p>
          ) : (
            queue.data.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 p-4"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.patient_name} · Due {item.due_date} ·{" "}
                    <span className="capitalize">{item.priority}</span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <Badge
                      variant={
                        item.status === "overdue"
                          ? "destructive"
                          : item.status === "review_required"
                            ? "warning"
                            : "outline"
                      }
                      className="capitalize"
                    >
                      {item.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/doctor/patients/${item.patient_id}?tab=discharge`}
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
                  >
                    Open patient
                  </Link>
                  {(item.status === "review_required" ||
                    item.status === "overdue" ||
                    item.status === "pending") &&
                  user?.id ? (
                    <Button
                      size="sm"
                      disabled={review.isPending}
                      onClick={() =>
                        review.mutate({
                          id: item.id,
                          doctorUserId: user.id,
                          decision: "completed",
                        })
                      }
                    >
                      Mark complete
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileUp,
  FlaskConical,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import {
  useInvestigationMutations,
  usePatientInvestigations,
} from "@/modules/investigations/hooks";
import type { InvestigationView } from "@/modules/investigations/types";

function statusVariant(status: InvestigationView["status"]) {
  if (status === "overdue") return "destructive" as const;
  if (status === "completed") return "secondary" as const;
  if (status === "review_required") return "warning" as const;
  return "outline" as const;
}

export function PendingInvestigationsPanel({
  patientId,
  title = "Pending Investigations",
  mode = "patient",
}: {
  patientId: string;
  title?: string;
  mode?: "patient" | "readonly" | "doctor";
}) {
  const { user } = useAuth();
  const list = usePatientInvestigations(patientId);
  const { markCompleted, uploadReport, review } = useInvestigationMutations();
  const [openId, setOpenId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const items = (list.data || []).filter((i) => i.status !== "cancelled");
  const pending = items.filter((i) =>
    ["pending", "scheduled", "overdue", "review_required"].includes(i.status),
  );

  return (
    <Card className="border-sky-100/80 bg-gradient-to-br from-sky-50/40 to-card">
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FlaskConical className="h-4 w-4 text-sky-700" />
          {title}
        </CardTitle>
        <Badge variant="outline">{pending.length} open</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {list.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading investigations…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No investigations prescribed yet.
          </p>
        ) : (
          items.map((item, index) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="rounded-2xl border border-border/80 bg-background/80 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Due {item.due_date}
                    {item.days_until_due < 0
                      ? ` · ${Math.abs(item.days_until_due)}d overdue`
                      : item.days_until_due === 0
                        ? " · due today"
                        : ` · in ${item.days_until_due}d`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant={statusVariant(item.status)} className="capitalize">
                    {item.status.replaceAll("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {item.priority}
                  </Badge>
                </div>
              </div>

              {item.notes ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Doctor notes: </span>
                  {item.notes}
                </p>
              ) : null}

              {openId === item.id ? (
                <div className="mt-3 space-y-2 rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                  {item.purpose ? (
                    <p>
                      <strong>Purpose:</strong> {item.purpose}
                    </p>
                  ) : null}
                  {item.preparation ? (
                    <p>
                      <strong>Preparation:</strong> {item.preparation}
                    </p>
                  ) : null}
                  {item.attachment_url ? (
                    <div>
                      <p className="mb-1 font-medium text-foreground">
                        Uploaded report
                      </p>
                      {item.attachment_mime?.startsWith("image/") ? (
                        <img
                          src={item.attachment_url}
                          alt={item.attachment_name || "Report"}
                          className="max-h-48 rounded-lg border"
                        />
                      ) : (
                        <a
                          href={item.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          {item.attachment_name || "Open report"}
                        </a>
                      )}
                    </div>
                  ) : null}
                  <p className="text-xs">
                    HealNexus does not interpret investigation results. Your
                    doctor reviews them.
                  </p>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setOpenId((cur) => (cur === item.id ? null : item.id))
                  }
                >
                  <ClipboardList className="mr-1 h-3.5 w-3.5" />
                  View details
                </Button>

                {mode === "patient" &&
                (item.status === "pending" ||
                  item.status === "scheduled" ||
                  item.status === "overdue") ? (
                  <>
                    <Button
                      size="sm"
                      disabled={markCompleted.isPending}
                      onClick={() => markCompleted.mutate(item.id)}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                      Mark completed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={uploadReport.isPending}
                      onClick={() => {
                        setUploadTarget(item.id);
                        fileRef.current?.click();
                      }}
                    >
                      <FileUp className="mr-1 h-3.5 w-3.5" />
                      Upload report
                    </Button>
                  </>
                ) : null}

                {mode === "doctor" &&
                (item.status === "review_required" ||
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
                    Mark reviewed complete
                  </Button>
                ) : null}

                {item.status === "overdue" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Overdue — complete soon
                  </span>
                ) : null}
              </div>
            </motion.article>
          ))
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && uploadTarget) {
              uploadReport.mutate({ id: uploadTarget, file });
            }
            e.target.value = "";
            setUploadTarget(null);
          }}
        />
      </CardContent>
    </Card>
  );
}

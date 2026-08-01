import { useState } from "react";
import { FlaskConical } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { openAttachment } from "@/lib/open-attachment";
import {
  useDoctorReports,
  useReportMutations,
} from "@/modules/reports/hooks";

export function DoctorReportsPage() {
  const query = useDoctorReports();
  const { feedback } = useReportMutations();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  if (query.isLoading) return <LoadingScreen fullScreen={false} />;
  if (query.isError) {
    return (
      <ErrorState
        title="Unable to load reports"
        description={query.error.message}
        onRetry={() => void query.refetch()}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-10">
      <PageHeader
        eyebrow="Clinical records"
        title="Patient reports"
        description="Review uploaded blood/lab reports and send feedback that appears in the patient inbox."
      />

      <div className="space-y-3">
        {(query.data || []).length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No uploads yet"
            description="When patients upload reports, they will appear here for review."
          />
        ) : (
          (query.data || []).map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {r.patient_name} · {r.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()} · {r.report_type}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {r.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                {r.notes ? (
                  <p className="text-sm text-muted-foreground">{r.notes}</p>
                ) : null}
                {r.attachment_url ? (
                  <button
                    type="button"
                    className="text-left text-sm text-primary underline"
                    onClick={() =>
                      void openAttachment(
                        r.attachment_url!,
                        r.attachment_name || "report.pdf",
                      )
                    }
                  >
                    {r.attachment_name || "Open attachment"}
                  </button>
                ) : null}
                {r.doctor_feedback ? (
                  <div className="rounded-xl bg-muted/50 px-3 py-2 text-sm">
                    <p className="font-medium">Your feedback</p>
                    <p className="mt-1">{r.doctor_feedback}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Feedback for patient (interpretation, next steps)…"
                      value={drafts[r.id] || ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))
                      }
                      rows={3}
                    />
                    <Button
                      size="sm"
                      disabled={
                        feedback.isPending || !(drafts[r.id] || "").trim()
                      }
                      onClick={() =>
                        feedback.mutate({
                          reportId: r.id,
                          text: drafts[r.id] || "",
                        })
                      }
                    >
                      Send feedback
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

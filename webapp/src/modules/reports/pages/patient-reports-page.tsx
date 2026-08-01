import { useState } from "react";
import { FileUp, FlaskConical } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  usePatientReports,
  useReportMutations,
} from "@/modules/reports/hooks";

export function PatientReportsPage() {
  const query = usePatientReports();
  const { upload } = useReportMutations();
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("blood");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

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
    <div className="mx-auto flex max-w-3xl flex-col gap-6 pb-10">
      <PageHeader
        eyebrow="Records"
        title="My reports"
        description="Upload blood reports or other documents. Your doctor can review and send feedback here."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileUp className="h-4 w-4 text-primary" />
            Upload report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="HbA1c / Lipid profile / CBC"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="blood">Blood report</option>
              <option value="imaging">Imaging</option>
              <option value="other">Other</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Notes for doctor</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label>File (PDF / image)</Label>
            <Input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button
            disabled={upload.isPending || !title.trim()}
            onClick={() => {
              const reader = new FileReader();
              const finish = (fileUrl?: string) => {
                upload.mutate(
                  {
                    title,
                    report_type: reportType,
                    notes,
                    fileName: file?.name,
                    fileUrl,
                    mime: file?.type,
                  },
                  {
                    onSuccess: () => {
                      setTitle("");
                      setNotes("");
                      setFile(null);
                    },
                  },
                );
              };
              if (file) {
                reader.onload = () => finish(String(reader.result || ""));
                reader.readAsDataURL(file);
              } else {
                finish();
              }
            }}
          >
            {upload.isPending ? "Uploading…" : "Upload"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {(query.data || []).length === 0 ? (
          <EmptyState
            icon={FlaskConical}
            title="No reports yet"
            description="Upload your first lab or clinical report for doctor review."
          />
        ) : (
          (query.data || []).map((r) => (
            <Card key={r.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{r.title}</p>
                  <Badge variant="outline" className="capitalize">
                    {r.status.replaceAll("_", " ")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()} · {r.report_type}
                </p>
                {r.attachment_name ? (
                  <a
                    href={r.attachment_url || "#"}
                    className="text-sm text-primary underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {r.attachment_name}
                  </a>
                ) : null}
                {r.doctor_feedback ? (
                  <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                    <p className="font-medium">Doctor feedback</p>
                    <p className="mt-1">{r.doctor_feedback}</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Awaiting doctor review
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

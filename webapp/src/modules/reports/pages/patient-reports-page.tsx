import { useMemo, useState } from "react";
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
import { useAuth } from "@/contexts/auth-context";
import { openAttachment } from "@/lib/open-attachment";
import {
  usePatientReports,
  useReportMutations,
} from "@/modules/reports/hooks";
import { listDoctorsForPatient } from "@/modules/reports/repository";

export function PatientReportsPage({ embedded = false }: { embedded?: boolean }) {
  const { user } = useAuth();
  const query = usePatientReports();
  const { upload } = useReportMutations();
  const doctors = useMemo(
    () => (user?.id ? listDoctorsForPatient(user.id) : []),
    [user?.id, query.dataUpdatedAt],
  );
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState("blood");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [doctorId, setDoctorId] = useState("");

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

  const selectedDoctor = doctorId || doctors[0]?.id || "";

  return (
    <div className={embedded ? "space-y-5" : "mx-auto flex max-w-3xl flex-col gap-6 pb-10"}>
      {!embedded ? (
        <PageHeader
          eyebrow="Records"
          title="My reports"
          description="Upload a PDF/image and choose which doctor receives it. Files open from secure local storage."
        />
      ) : (
        <div>
          <h2 className="font-display text-xl font-semibold">Uploaded reports</h2>
          <p className="text-sm text-muted-foreground">
            Select a doctor, attach the file, then upload — it appears for that doctor immediately.
          </p>
        </div>
      )}

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
            <Label>Send to doctor</Label>
            <Select
              value={selectedDoctor}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              {doctors.length === 0 ? (
                <option value="">No linked doctor</option>
              ) : (
                doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.specialty ? ` · ${d.specialty}` : ""}
                  </option>
                ))
              )}
            </Select>
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
            <Label>File (PDF / image) — required</Label>
            <Input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <Button
            disabled={
              upload.isPending || !title.trim() || !file || !selectedDoctor
            }
            onClick={() => {
              upload.mutate(
                {
                  title,
                  report_type: reportType,
                  notes,
                  file,
                  doctorId: selectedDoctor,
                },
                {
                  onSuccess: () => {
                    setTitle("");
                    setNotes("");
                    setFile(null);
                  },
                },
              );
            }}
          >
            {upload.isPending ? "Uploading…" : "Upload to doctor"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-medium">Your uploads</h3>
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
                  {r.doctor_name ? ` · to ${r.doctor_name}` : ""}
                </p>
                {r.attachment_url ? (
                  <button
                    type="button"
                    className="text-left text-sm text-primary underline"
                    onClick={() =>
                      void openAttachment(
                        r.attachment_url!,
                        r.attachment_name || "report.pdf",
                      ).catch((e) =>
                        alert(e instanceof Error ? e.message : "Could not open"),
                      )
                    }
                  >
                    {r.attachment_name || "Open attachment"}
                  </button>
                ) : (
                  <p className="text-xs text-destructive">No file attached</p>
                )}
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

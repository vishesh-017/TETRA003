import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { exportReportCsv, exportReportPdf } from "@/modules/analytics/export";
import { analyticsRepository } from "@/modules/analytics/repository";
import type { ReportKind } from "@/modules/analytics/types";
import { useDoctorPatients } from "@/modules/doctor/hooks";

const REPORTS: Array<{ id: ReportKind; label: string; blurb: string }> = [
  {
    id: "doctor",
    label: "Doctor Report",
    blurb: "Caseload, recovery, follow-up performance",
  },
  {
    id: "patient",
    label: "Patient Report",
    blurb: "Individual attention snapshot for clinical review",
  },
  {
    id: "hospital",
    label: "Hospital Report",
    blurb: "Disease mix, risk, and recovery outlook",
  },
  {
    id: "weekly",
    label: "Weekly Summary",
    blurb: "Executive week-over-week narrative",
  },
  {
    id: "monthly",
    label: "Monthly Summary",
    blurb: "Longer-horizon decision support pack",
  },
];

export function InteractiveReports() {
  const { user, accessToken } = useAuth();
  const userId = user?.id || accessToken || "";
  const patients = useDoctorPatients({});
  const [kind, setKind] = useState<ReportKind>("weekly");
  const [patientId, setPatientId] = useState("");

  const run = (format: "csv" | "pdf") => {
    if (!userId) return;
    try {
      const report = analyticsRepository.buildReport(
        userId,
        kind,
        kind === "patient" ? patientId || undefined : undefined,
      );
      if (format === "csv") exportReportCsv(report);
      else exportReportPdf(report);
      toast.success(
        format === "csv" ? "CSV downloaded" : "Print dialog opened for PDF",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    }
  };

  return (
    <section className="rounded-3xl border border-border/80 bg-card/70 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">
            Interactive Reports
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Charts, tables, AI summary, and recommendations — export as CSV or
            PDF.
          </p>
        </div>
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setKind(r.id)}
            className={`rounded-2xl border px-3 py-3 text-left transition-colors ${
              kind === r.id
                ? "border-primary/40 bg-primary/10"
                : "border-border/80 bg-background/50 hover:bg-muted/40"
            }`}
          >
            <p className="text-sm font-medium">{r.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{r.blurb}</p>
          </button>
        ))}
      </div>

      {kind === "patient" ? (
        <label className="mt-4 block text-xs text-muted-foreground">
          Patient
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="mt-1 flex h-10 w-full max-w-md rounded-xl border border-input bg-background px-3 text-sm text-foreground"
          >
            <option value="">Select patient (optional)</option>
            {(patients.data || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => run("pdf")}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
        <Button type="button" variant="outline" onClick={() => run("csv")}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>
    </section>
  );
}

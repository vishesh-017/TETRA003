import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FieldPatientsMap } from "@/modules/rural/components/field-patients-map";
import { useAssignedPatients } from "@/modules/rural/hooks";
import { useRuralLocale } from "@/modules/rural/i18n/locale-context";

export function RuralPatientsPage() {
  const { t } = useRuralLocale();
  const patients = useAssignedPatients();

  if (patients.isLoading)
    return <LoadingScreen label="…" fullScreen={false} />;

  const list = patients.data || [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-semibold">{t("patients")}</h2>
        <p className="text-sm text-muted-foreground">
          Live map of assigned patients by village. Tap a pin for details.
          Screening is in Field work after passport / username verify, or as a
          camp batch.
        </p>
      </div>

      {list.length ? (
        <>
          <FieldPatientsMap patients={list} />
          <div className="flex flex-wrap gap-3 text-[11px] font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" /> Low /
              unset
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D97706]" /> Moderate
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#EA580C]" /> High
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]" /> Critical
            </span>
          </div>
        </>
      ) : (
        <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
          No assigned patients on the map yet.
        </p>
      )}

      <Link
        to="/rural/screening"
        className={cn(buttonVariants({ size: "lg" }), "h-12 w-full")}
      >
        Open field work (camp / verify)
      </Link>

      <div className="space-y-3">
        {list.map((p) => (
          <div
            key={p.id}
            className="rounded-3xl border border-border bg-card p-4 shadow-soft"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-semibold">{p.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.village || "—"} · {p.phone || "No phone"}
                </p>
              </div>
              {p.risk_level ? (
                <Badge
                  variant={
                    p.risk_level === "critical" || p.risk_level === "high"
                      ? "destructive"
                      : "outline"
                  }
                  className="capitalize"
                >
                  {p.risk_level}
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {p.conditions.join(", ") || "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

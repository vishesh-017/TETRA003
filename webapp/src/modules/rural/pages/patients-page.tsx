import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { useAssignedPatients } from "@/modules/rural/hooks";
import { useRuralLocale } from "@/modules/rural/i18n/locale-context";
import { cn } from "@/lib/utils";

export function RuralPatientsPage() {
  const { t } = useRuralLocale();
  const patients = useAssignedPatients();

  if (patients.isLoading)
    return <LoadingScreen label="…" fullScreen={false} />;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-semibold">{t("patients")}</h2>
      {(patients.data || []).map((p) => (
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
          <Link
            to={`/rural/screening?patient=${p.id}`}
            className={cn(buttonVariants({ size: "lg" }), "mt-3 h-12 w-full")}
          >
            {t("startScreening")}
          </Link>
        </div>
      ))}
    </div>
  );
}

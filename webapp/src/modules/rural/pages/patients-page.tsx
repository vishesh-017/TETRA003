import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { useAssignedPatients } from "@/modules/rural/hooks";
import { useRuralLocale } from "@/modules/rural/i18n/locale-context";
import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Demo village pins on a simple Gujarat field map (not GPS). */
const VILLAGE_PIN: Record<string, { x: number; y: number }> = {
  Sanand: { x: 32, y: 48 },
  Bavla: { x: 58, y: 62 },
  Ahmedabad: { x: 48, y: 28 },
};

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
          Map shows assigned patient villages. Screening happens in Field work
          after passport / username verify — or as a camp batch.
        </p>
      </div>

      <div className="relative h-56 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:18px_18px]" />
        <p className="absolute left-3 top-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Field map · Gujarat demo
        </p>
        {list.map((p) => {
          const key = (p.village || "Ahmedabad").split("/")[0]?.trim() || "Ahmedabad";
          const pin = VILLAGE_PIN[key] || VILLAGE_PIN.Ahmedabad;
          return (
            <div
              key={p.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              title={`${p.full_name} · ${p.village || "—"}`}
            >
              <span
                className={cn(
                  "block h-3.5 w-3.5 rounded-full border-2 border-white shadow",
                  p.risk_level === "critical" || p.risk_level === "high"
                    ? "bg-destructive"
                    : "bg-primary",
                )}
              />
              <span className="mt-0.5 block max-w-[72px] truncate text-[10px] font-medium">
                {p.full_name.split(" ")[0]}
              </span>
            </div>
          );
        })}
      </div>

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

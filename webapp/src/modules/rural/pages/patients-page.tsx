import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FieldRouteMap } from "@/modules/rural/components/field-route-map";
import { useAssignedPatients, useRuralScreenings } from "@/modules/rural/hooks";
import { useRuralLocale } from "@/modules/rural/i18n/locale-context";
import { listCampLocations } from "@/modules/rural/services/camps.service";

function formatCampDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export function RuralPatientsPage() {
  const { t } = useRuralLocale();
  const patients = useAssignedPatients();
  const screenings = useRuralScreenings();

  if (patients.isLoading || screenings.isLoading)
    return <LoadingScreen label="…" fullScreen={false} />;

  const list = patients.data || [];
  const camps = listCampLocations(screenings.data || []);

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
          <MapPin className="h-5 w-5 text-primary" />
          Ahmedabad camps &amp; patients
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Teal <strong>C</strong> pins are camps (admin-created). Coloured dots
          are assigned patient locations across Ahmedabad areas.
        </p>
      </div>

      <FieldRouteMap camps={camps} patients={list} />

      <div className="flex flex-wrap gap-3 text-[11px] font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-[10px] font-bold text-white">
            C
          </span>
          Camp site
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#2563EB]" /> Patient
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#EA580C]" /> High risk
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#DC2626]" /> Critical
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {camps.map((camp) => (
          <Link
            key={camp.id}
            to="/rural/screening"
            className="group rounded-3xl border border-border bg-card p-4 shadow-soft transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold leading-snug group-hover:text-primary">
                {camp.name}
                <ArrowRight className="ml-1 inline h-4 w-4 opacity-0 transition group-hover:opacity-100" />
              </p>
              <Badge
                variant="outline"
                className={
                  camp.status === "synced"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-900"
                }
              >
                {camp.status === "synced" ? "Synced" : "Pending"}
              </Badge>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {camp.place}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>{formatCampDate(camp.date)}</span>
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {camp.screened} screened
              </span>
            </div>
            {camp.portalUsernames.length ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Portal: {camp.portalUsernames.join(", ")}
              </p>
            ) : null}
          </Link>
        ))}
      </div>

      <Link
        to="/rural/screening"
        className={cn(buttonVariants({ size: "lg" }), "h-12 w-full")}
      >
        Open field work (pick camp from dropdown)
      </Link>

      <div className="space-y-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {t("patients")}
          </p>
          <h3 className="font-display text-lg font-semibold">
            Assigned patients
          </h3>
        </div>
        {list.map((p) => (
          <div
            key={p.id}
            className="rounded-3xl border border-border bg-card p-4 shadow-soft"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-lg font-semibold">{p.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {p.village || "Ahmedabad"} · {p.phone || "No phone"}
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

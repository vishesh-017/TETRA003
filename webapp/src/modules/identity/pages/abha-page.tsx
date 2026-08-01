import { useState } from "react";
import { Link } from "react-router-dom";

import { Button, buttonVariants } from "@/components/ui/button";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { AbhaImportWizard } from "@/modules/identity/components/abha-import-wizard";
import {
  useBenefitsDashboard,
  useDigitalPassport,
  useHealthRecords,
} from "@/modules/identity/hooks";

export function AbhaPage() {
  const { user } = useAuth();
  const passport = useDigitalPassport();
  const records = useHealthRecords();
  const benefits = useBenefitsDashboard();
  const [open, setOpen] = useState(false);
  const passportHref =
    user?.role === "doctor"
      ? "/doctor/patients"
      : user?.role === "caregiver"
        ? "/caregiver"
        : "/patient/passport";
  const backLabel =
    user?.role === "doctor"
      ? "Back to patients"
      : user?.role === "caregiver"
        ? "Back to home"
        : "Back to Passport";

  if (passport.isLoading || records.isLoading)
    return <LoadingScreen label="Loading ABHA workspace…" fullScreen={false} />;

  const grouped = groupByCategory(records.data || []);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            ABDM Compatible
          </p>
          <h1 className="font-display text-3xl font-semibold">ABHA Records</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo import experience — architecture ready for future ABDM APIs.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>Import via ABHA</Button>
      </div>

      <div className="glass-panel rounded-3xl p-5">
        <p className="text-sm text-muted-foreground">ABHA ID</p>
        <p className="font-mono text-lg font-semibold">
          {benefits.data?.abha_id || passport.data?.abha_id_demo || "Not linked"}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Status:{" "}
          {benefits.data?.abha_linked ? "Linked (demo)" : "Available to link"}
        </p>
      </div>

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="glass-panel rounded-3xl p-5">
          <h2 className="font-display text-xl font-semibold capitalize">
            {category.replaceAll("_", " ")}
          </h2>
          <ul className="mt-3 space-y-2">
            {items.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-border/70 px-3 py-2.5 text-sm"
              >
                <p className="font-medium">{r.title}</p>
                <p className="text-muted-foreground">{r.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {!records.data?.length ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="font-medium">No linked records yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Import a demo ABHA pack to populate medical history.
          </p>
          <Button className="mt-4" onClick={() => setOpen(true)}>
            Start import
          </Button>
        </div>
      ) : null}

      <Link
        to={passportHref}
        className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
      >
        {backLabel}
      </Link>

      <AbhaImportWizard
        open={open}
        onClose={() => setOpen(false)}
        defaultAbha={passport.data?.abha_id_demo}
        onImported={() => {
          void records.refetch();
          void benefits.refetch();
          void passport.refetch();
        }}
      />
    </div>
  );
}

function groupByCategory<T extends { category: string }>(rows: T[]) {
  return rows.reduce<Record<string, T[]>>((acc, row) => {
    acc[row.category] = acc[row.category] || [];
    acc[row.category]!.push(row);
    return acc;
  }, {});
}

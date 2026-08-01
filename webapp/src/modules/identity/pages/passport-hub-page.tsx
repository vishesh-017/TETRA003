import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AbhaImportWizard } from "@/modules/identity/components/abha-import-wizard";
import { EmergencyCard } from "@/modules/identity/components/emergency-card";
import { MedicalTimeline } from "@/modules/identity/components/medical-timeline";
import {
  PassportDetailGrid,
  PassportWallet,
} from "@/modules/identity/components/passport-wallet";
import {
  useDigitalPassport,
  useHealthRecords,
  useMedicalTimeline,
} from "@/modules/identity/hooks";

export function PassportHubPage() {
  const passport = useDigitalPassport();
  const timeline = useMedicalTimeline();
  const records = useHealthRecords();
  const [abhaOpen, setAbhaOpen] = useState(false);

  if (passport.isLoading)
    return <LoadingScreen label="Opening your health passport…" fullScreen={false} />;
  if (passport.isError || !passport.data)
    return (
      <ErrorState
        description="Could not load digital passport."
        onRetry={() => void passport.refetch()}
      />
    );

  const p = passport.data;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-end justify-between gap-3"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Digital Health Identity
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Your Passport
          </h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            One screen for who you are medically — wallet-simple, clinician-trusted.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAbhaOpen(true)}>
            Import via ABHA
          </Button>
          <Link
            to="/government/pmjay"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            PM-JAY Assistant
          </Link>
        </div>
      </motion.div>

      <AiDisclaimer />
      <PassportWallet passport={p} />
      <EmergencyCard passport={p} />
      <PassportDetailGrid passport={p} />

      {(records.data?.length ?? 0) > 0 ? (
        <section className="glass-panel rounded-3xl p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Linked health records
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {records.data!.slice(0, 6).map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-border/70 bg-background/50 px-3 py-2.5 text-sm"
              >
                <p className="text-[11px] capitalize text-muted-foreground">
                  {r.category.replaceAll("_", " ")} · {r.source}
                </p>
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.summary}</p>
              </div>
            ))}
          </div>
          <Link
            to="/government/abha"
            className="mt-3 inline-block text-sm text-primary"
          >
            Manage ABHA records →
          </Link>
        </section>
      ) : null}

      {timeline.data ? <MedicalTimeline events={timeline.data} /> : null}

      <div className="flex flex-wrap gap-2">
        <Link
          to="/government/benefits"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Benefits dashboard
        </Link>
        <Link
          to="/patient/recovery-score"
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Recovery insights
        </Link>
      </div>

      <AbhaImportWizard
        open={abhaOpen}
        onClose={() => setAbhaOpen(false)}
        defaultAbha={p.abha_id_demo}
        onImported={() => {
          void passport.refetch();
          void records.refetch();
          void timeline.refetch();
        }}
      />
    </div>
  );
}

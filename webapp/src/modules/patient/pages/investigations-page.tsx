import { motion } from "framer-motion";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PendingInvestigationsPanel } from "@/modules/investigations/components/pending-investigations";
import { useTodayDashboard } from "@/modules/patient/hooks";

export function PatientInvestigationsPage() {
  const dash = useTodayDashboard();

  if (dash.isLoading) {
    return <LoadingScreen label="Loading investigations…" fullScreen={false} />;
  }

  if (!dash.data) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Sign in as a patient to view prescribed investigations.
      </p>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-semibold">
          Pending Investigations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete tests prescribed after discharge. Upload reports if you have
          them — your doctor reviews results. AI never interprets them.
        </p>
      </motion.div>
      <AiDisclaimer />
      <PendingInvestigationsPanel
        patientId={dash.data.patient_id}
        mode="patient"
      />
    </div>
  );
}

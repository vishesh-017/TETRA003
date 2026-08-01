import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Tabs } from "@/components/ui/tabs";
import { AddInvestigationForm } from "@/modules/investigations/components/add-investigation-form";
import { PendingInvestigationsPanel } from "@/modules/investigations/components/pending-investigations";
import { investigationKeys } from "@/modules/investigations/hooks";
import { useTodayDashboard } from "@/modules/patient/hooks";
import { PatientReportsPage } from "@/modules/reports/pages/patient-reports-page";
import { useState } from "react";

const TABS = [
  { id: "labs", label: "Labs & tests" },
  { id: "reports", label: "Uploaded reports" },
];

export function PatientInvestigationsPage() {
  const dash = useTodayDashboard();
  const qc = useQueryClient();
  const [tab, setTab] = useState("labs");

  if (dash.isLoading) {
    return <LoadingScreen label="Loading reports…" fullScreen={false} />;
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
        <h1 className="font-display text-3xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Labs, imaging, and uploaded files in one place. You or your doctor can
          add a test — both stay in sync.
        </p>
      </motion.div>
      <AiDisclaimer />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "labs" ? (
        <>
          <AddInvestigationForm
            patientId={dash.data.patient_id}
            requestedBy="patient"
            onCreated={() =>
              void qc.invalidateQueries({ queryKey: investigationKeys.all })
            }
          />
          <PendingInvestigationsPanel
            patientId={dash.data.patient_id}
            mode="patient"
          />
        </>
      ) : (
        <PatientReportsPage embedded />
      )}
    </div>
  );
}

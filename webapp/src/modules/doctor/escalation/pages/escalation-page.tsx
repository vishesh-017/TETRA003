import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { PageHeader } from "@/components/ui/page-header";
import { useAppLocale } from "@/i18n/locale-context";
import { ActivePanel } from "@/modules/doctor/escalation/components/active-panel";
import { ReferralModal } from "@/modules/doctor/escalation/components/referral-modal";
import { RiskPanel } from "@/modules/doctor/escalation/components/risk-panel";
import {
  useEscalationActions,
  useEscalationBundle,
  usePatientRiskData,
} from "@/modules/doctor/escalation/hooks";
import type { RiskFilter } from "@/modules/doctor/escalation/types";

export function EscalationPage() {
  const { t } = useAppLocale();
  const navigate = useNavigate();
  const bundle = useEscalationBundle();
  const actions = useEscalationActions();

  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [referOpen, setReferOpen] = useState(false);

  const riskQuery = usePatientRiskData(selectedId);

  const filtered = useMemo(() => {
    const rows = bundle.data?.patients ?? [];
    const q = search.trim().toLowerCase();
    return rows.filter((p) => {
      if (riskFilter !== "all" && p.risk_level !== riskFilter) return false;
      if (!q) return true;
      return (
        p.full_name.toLowerCase().includes(q) ||
        p.primary_diagnosis.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q)
      );
    });
  }, [bundle.data?.patients, search, riskFilter]);

  const dynamicCounts = useMemo(() => {
    const base = bundle.data?.counts ?? {
      all: 0,
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
    };
    const q = search.trim().toLowerCase();
    if (!q) return base;
    const searched = (bundle.data?.patients ?? []).filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        p.primary_diagnosis.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q),
    );
    return {
      all: searched.length,
      critical: searched.filter((p) => p.risk_level === "critical").length,
      high: searched.filter((p) => p.risk_level === "high").length,
      moderate: searched.filter((p) => p.risk_level === "moderate").length,
      low: searched.filter((p) => p.risk_level === "low").length,
    };
  }, [bundle.data, search]);

  if (bundle.isLoading) {
    return <LoadingScreen fullScreen={false} variant="skeleton" />;
  }
  if (bundle.isError || !bundle.data) {
    return (
      <ErrorState
        title="Unable to load Active Panel"
        description={bundle.error?.message || "Please try again."}
        onRetry={() => void bundle.refetch()}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-5 pb-10">
      <PageHeader
        eyebrow="Command"
        title={t("nav_escalation")}
        description={t("escalation_desc")}
      />

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.95fr]">
        <ActivePanel
          patients={filtered}
          counts={dynamicCounts}
          search={search}
          riskFilter={riskFilter}
          selectedId={selectedId}
          onSearchChange={setSearch}
          onRiskFilterChange={setRiskFilter}
          onOpen={(id) => setSelectedId(id)}
        />

        <div className="xl:sticky xl:top-4 xl:self-start">
          {!selectedId ? (
            <div className="rounded-3xl border border-dashed border-border bg-muted/20 px-5 py-16 text-center">
              <p className="font-display text-lg font-semibold">
                {t("risk_panel")}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("risk_panel_empty")}
              </p>
            </div>
          ) : riskQuery.isLoading || !riskQuery.data ? (
            <LoadingScreen fullScreen={false} variant="skeleton" />
          ) : (
            <RiskPanel
              risk={riskQuery.data}
              orderingName={
                actions.orderInvestigation.isPending
                  ? String(
                      actions.orderInvestigation.variables?.name || "",
                    )
                  : null
              }
              onBack={() => setSelectedId(null)}
              onRefer={() => setReferOpen(true)}
              onOpenChart={() =>
                navigate(`/doctor/patients/${selectedId}?tab=risk`)
              }
              onOrder={(name) =>
                actions.orderInvestigation.mutate({
                  patientId: selectedId,
                  name,
                })
              }
            />
          )}
        </div>
      </div>

      <ReferralModal
        open={referOpen}
        risk={riskQuery.data ?? null}
        submitting={actions.submitReferral.isPending}
        onClose={() => setReferOpen(false)}
        onSubmit={(payload) => {
          actions.submitReferral.mutate(payload, {
            onSuccess: () => setReferOpen(false),
          });
        }}
      />
    </div>
  );
}

import { motion } from "framer-motion";
import {
  AlertTriangle,
  RefreshCw,
  Stethoscope,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

import { LoadingScreen } from "@/components/feedback/loading-screen";
import { buttonVariants } from "@/components/ui/button";
import { useRuralLocale } from "@/modules/rural/i18n/locale-context";
import {
  useRuralDashboard,
  useRuralSync,
} from "@/modules/rural/hooks";
import { cn } from "@/lib/utils";

export function RuralDashboardPage() {
  const { t } = useRuralLocale();
  const dash = useRuralDashboard();
  const { sync } = useRuralSync();

  if (dash.isLoading || !dash.data)
    return <LoadingScreen label="…" fullScreen={false} />;

  const d = dash.data;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t("patientsAssigned")} value={d.patients_assigned_today} />
        <StatCard label={t("visitsDue")} value={d.home_visits_due} />
        <StatCard label={t("highRisk")} value={d.high_risk_patients} warn />
        <StatCard label={t("pendingSync")} value={d.pending_sync} />
      </div>

      <div className="grid gap-3">
        <Link
          to="/rural/screening"
          className={cn(
            buttonVariants({ size: "lg" }),
            "h-14 justify-start gap-3 rounded-2xl text-base",
          )}
        >
          <Stethoscope className="h-5 w-5" />
          {t("startScreening")}
        </Link>
        <Link
          to="/rural/patients"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "h-14 justify-start gap-3 rounded-2xl text-base",
          )}
        >
          <Users className="h-5 w-5" />
          {t("viewPatients")}
        </Link>
        <button
          type="button"
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className={cn(
            buttonVariants({ variant: "secondary", size: "lg" }),
            "h-14 justify-start gap-3 rounded-2xl text-base",
          )}
        >
          <RefreshCw
            className={cn("h-5 w-5", sync.isPending && "animate-spin")}
          />
          {t("syncData")}
        </button>
        <Link
          to="/rural/notifications"
          className={cn(
            buttonVariants({ variant: "destructive", size: "lg" }),
            "h-14 justify-start gap-3 rounded-2xl text-base",
          )}
        >
          <AlertTriangle className="h-5 w-5" />
          {t("emergencyAlert")}
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-3xl border border-border bg-card p-4 shadow-soft",
        warn && value > 0 && "border-destructive/40 bg-destructive/5",
      )}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
        {value}
      </p>
    </motion.div>
  );
}

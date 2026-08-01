import { RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import {
  useOnlineStatus,
  useRuralScreenings,
  useRuralSync,
} from "@/modules/rural/hooks";
import { useRuralLocale } from "@/modules/rural/i18n/locale-context";
import type { OfflineSyncState } from "@/types/domain";

export function RuralSyncPage() {
  const { t } = useRuralLocale();
  const online = useOnlineStatus();
  const screenings = useRuralScreenings();
  const { pending, sync } = useRuralSync();

  if (screenings.isLoading)
    return <LoadingScreen label="…" fullScreen={false} />;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <p className="text-sm text-muted-foreground">
          {online ? t("online") : t("offline")}
        </p>
        <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
          {pending.data ?? 0}
        </p>
        <p className="text-sm text-muted-foreground">{t("pendingSync")}</p>
        <Button
          size="lg"
          className="mt-4 h-14 w-full gap-2 text-base"
          disabled={!online || sync.isPending}
          onClick={() => sync.mutate()}
        >
          <RefreshCw className={sync.isPending ? "animate-spin" : ""} />
          {t("syncNow")}
        </Button>
        {sync.data ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Synced {sync.data.synced} · Failed {sync.data.failed} · Conflicts{" "}
            {sync.data.conflicts_resolved}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        {(screenings.data || []).map((s) => (
          <div
            key={s.id}
            className="rounded-2xl border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{s.patient_name}</p>
              <StatusBadge state={s.sync_state} label={t(s.sync_state)} />
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(s.captured_at).toLocaleString()}
              {s.emergency ? " · EMERGENCY" : ""}
            </p>
            {s.error ? (
              <p className="mt-1 text-xs text-destructive">{s.error}</p>
            ) : null}
          </div>
        ))}
        {!screenings.data?.length ? (
          <p className="text-sm text-muted-foreground">No offline screenings yet.</p>
        ) : null}
      </div>
    </div>
  );
}

function StatusBadge({
  state,
  label,
}: {
  state: OfflineSyncState;
  label: string;
}) {
  const variant =
    state === "synced"
      ? "secondary"
      : state === "failed"
        ? "destructive"
        : state === "syncing"
          ? "default"
          : "outline";
  return (
    <Badge variant={variant} className="capitalize">
      {label}
    </Badge>
  );
}

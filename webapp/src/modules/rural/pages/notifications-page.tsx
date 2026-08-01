import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { useRuralNotifications } from "@/modules/rural/hooks";
import { useRuralLocale } from "@/modules/rural/i18n/locale-context";
import type { DictKey } from "@/modules/rural/i18n/dictionaries";

export function RuralNotificationsPage() {
  const { t } = useRuralLocale();
  const query = useRuralNotifications();

  if (query.isLoading)
    return <LoadingScreen label="…" fullScreen={false} />;

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-semibold">
        {t("notifications")}
      </h2>
      <p className="text-sm text-muted-foreground">
        Offline queue — delivered when online.
      </p>
      {(query.data || []).map((n) => (
        <div
          key={n.id}
          className={`rounded-3xl border p-4 ${
            n.kind === "emergency"
              ? "border-destructive/40 bg-destructive/5"
              : "border-border bg-card"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold">{n.title}</p>
            <Badge variant="outline" className="capitalize">
              {t(n.sync_state as DictKey)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            {new Date(n.created_at).toLocaleString()}
            {n.delivered_at
              ? ` · delivered ${new Date(n.delivered_at).toLocaleString()}`
              : ""}
          </p>
        </div>
      ))}
      {!query.data?.length ? (
        <p className="text-sm text-muted-foreground">No queued notifications.</p>
      ) : null}
    </div>
  );
}

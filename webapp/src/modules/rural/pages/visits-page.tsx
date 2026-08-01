import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { useHomeVisits } from "@/modules/rural/hooks";
import { useRuralLocale } from "@/modules/rural/i18n/locale-context";
import { todayKey } from "@/data/store";

export function RuralVisitsPage() {
  const { t } = useRuralLocale();
  const visits = useHomeVisits();
  const today = todayKey();

  if (visits.isLoading || !visits.data)
    return <LoadingScreen label="…" fullScreen={false} />;

  const groups = {
    today: visits.data.filter(
      (v) => v.scheduled_for === today && v.status !== "completed",
    ),
    completed: visits.data.filter((v) => v.status === "completed"),
    upcoming: visits.data.filter(
      (v) => v.status === "upcoming" || (v.scheduled_for > today && v.status !== "completed"),
    ),
    missed: visits.data.filter((v) => v.status === "missed"),
  };

  return (
    <div className="space-y-5">
      <Section title={t("todayVisits")} items={groups.today} onComplete={(id) => visits.complete.mutate(id)} completeLabel={t("markComplete")} />
      <Section title={t("upcomingVisits")} items={groups.upcoming} />
      <Section title={t("completedVisits")} items={groups.completed} />
      <Section title={t("missedVisits")} items={groups.missed} />
    </div>
  );
}

function Section({
  title,
  items,
  onComplete,
  completeLabel,
}: {
  title: string;
  items: Array<{
    id: string;
    patient_name: string;
    village: string | null;
    notes: string | null;
    status: string;
    scheduled_for: string;
  }>;
  onComplete?: (id: string) => void;
  completeLabel?: string;
}) {
  return (
    <section className="space-y-2">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {!items.length ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        items.map((v) => (
          <div
            key={v.id}
            className="rounded-3xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{v.patient_name}</p>
                <p className="text-sm text-muted-foreground">
                  {v.village || "—"} · {v.scheduled_for}
                </p>
              </div>
              <Badge variant="outline" className="capitalize">
                {v.status}
              </Badge>
            </div>
            {v.notes ? (
              <p className="mt-2 text-sm text-muted-foreground">{v.notes}</p>
            ) : null}
            {onComplete && v.status === "due" ? (
              <Button
                className="mt-3 h-12 w-full"
                size="lg"
                onClick={() => onComplete(v.id)}
              >
                {completeLabel}
              </Button>
            ) : null}
          </div>
        ))
      )}
    </section>
  );
}

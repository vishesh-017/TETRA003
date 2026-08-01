import { Pill } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { MedicineView } from "@/modules/patient/types";

export function MedicineCard({
  medicine,
  onTaken,
  onLate,
  onSkipped,
  busy,
}: {
  medicine: MedicineView;
  onTaken: () => void;
  onLate?: () => void;
  onSkipped: () => void;
  busy?: boolean;
}) {
  const statusLabel =
    medicine.today_status === "completed"
      ? "Taken"
      : medicine.today_status === "late"
        ? "Late taken"
        : medicine.today_status === "skipped"
          ? "Skipped"
          : "Due";

  return (
    <Card className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-lg font-semibold">{medicine.name}</h3>
              <Badge
                variant={
                  medicine.today_status === "completed" ||
                  medicine.today_status === "late"
                    ? "secondary"
                    : "outline"
                }
              >
                {statusLabel}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {medicine.dose || "Dose as prescribed"} · {medicine.frequency}
            </p>
            <p className="mt-1 text-sm text-foreground/80">
              Time: {medicine.time_slots.join(" · ") || "As directed"}
            </p>
            {medicine.instructions ? (
              <p className="mt-1 text-xs text-muted-foreground">{medicine.instructions}</p>
            ) : null}
          </div>
        </div>
        {medicine.today_status === "pending" ? (
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={onTaken}>
              Taken
            </Button>
            {onLate ? (
              <Button variant="secondary" disabled={busy} onClick={onLate}>
                Late taken
              </Button>
            ) : null}
            <Button variant="outline" disabled={busy} onClick={onSkipped}>
              Skipped
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

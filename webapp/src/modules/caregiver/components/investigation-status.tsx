import { motion } from "framer-motion";
import { FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatientInvestigations } from "@/modules/investigations/hooks";

export function CaregiverInvestigationStatus({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const list = usePatientInvestigations(patientId);
  const items = (list.data || []).filter((i) => i.status !== "cancelled");
  const pending = items.filter((i) =>
    ["pending", "scheduled"].includes(i.status),
  );
  const overdue = items.filter((i) => i.status === "overdue");
  const completed = items.filter((i) => i.status === "completed").length;

  return (
    <Card className="border-sky-100 bg-gradient-to-br from-sky-50/50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FlaskConical className="h-4 w-4 text-sky-700" />
          Investigations for {patientName.split(" ")[0]}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">{pending.length} pending</Badge>
          <Badge variant="destructive">{overdue.length} overdue</Badge>
          <Badge variant="secondary">{completed} completed</Badge>
        </div>

        {!items.length ? (
          <p className="text-sm text-muted-foreground">
            No prescribed investigations yet.
          </p>
        ) : (
          items.slice(0, 6).map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-border/70 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{item.name}</p>
                <Badge
                  variant={
                    item.status === "overdue"
                      ? "destructive"
                      : item.status === "completed"
                        ? "secondary"
                        : "outline"
                  }
                  className="capitalize"
                >
                  {item.status.replaceAll("_", " ")}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Due {item.due_date} · {item.priority}
                {item.preparation ? ` · ${item.preparation}` : ""}
              </p>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

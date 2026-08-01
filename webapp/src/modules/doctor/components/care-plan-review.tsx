import { useState } from "react";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { CarePlan } from "@/modules/doctor/types";

interface CarePlanReviewProps {
  carePlan: CarePlan;
  approving?: boolean;
  onApprove: (notes: string) => void;
}

export function CarePlanReview({
  carePlan,
  approving,
  onApprove,
}: CarePlanReviewProps) {
  const [notes, setNotes] = useState(carePlan.doctor_review_notes ?? "");
  const pending = carePlan.status === "ai_draft";

  return (
    <div className="space-y-4">
      <AiDisclaimer />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={pending ? "warning" : "secondary"}>
          {carePlan.status.replaceAll("_", " ")}
        </Badge>
        <p className="text-sm text-muted-foreground">{carePlan.disclaimer}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily medicine schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {carePlan.medicines.length === 0 ? (
              <p className="text-sm text-muted-foreground">No medicines organized.</p>
            ) : (
              carePlan.medicines.map((med) => (
                <div key={med.id} className="rounded-xl border border-border p-3">
                  <p className="font-medium">{med.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[med.dose, med.frequency, med.route].filter(Boolean).join(" · ")}
                  </p>
                  {med.instructions ? (
                    <p className="mt-1 text-xs text-muted-foreground">{med.instructions}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daily tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {carePlan.daily_tasks.map((task) => (
              <div key={task.id} className="rounded-xl border border-border p-3">
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Caregiver instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {carePlan.caregiver_instructions}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Patient-friendly instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {carePlan.patient_friendly_instructions}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Follow-up timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(carePlan.followup_timeline || []).map((item, index) => (
            <div
              key={index}
              className="rounded-xl border border-border px-3 py-2 text-sm"
            >
              {String(item.title || "Follow-up")}
              {item.due_date ? ` · ${String(item.due_date)}` : null}
              {item.offset_days != null ? ` · day ${String(item.offset_days)}` : null}
            </div>
          ))}
        </CardContent>
      </Card>

      {pending ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Doctor review & approve</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Optional review notes before publishing"
            />
            <Button disabled={approving} onClick={() => onApprove(notes)}>
              {approving ? "Publishing…" : "Approve & publish care plan"}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

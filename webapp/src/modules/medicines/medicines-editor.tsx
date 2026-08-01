import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { subscribeStore, type MedicineRow } from "@/data/store";
import {
  frequencyFromSlots,
  listMedicinesForPatient,
  MEAL_SLOTS,
  normalizeSlots,
  removeMedicine,
  upsertMedicine,
  type MedicineDraft,
} from "@/modules/medicines/repository";
import { cn } from "@/lib/utils";

const EMPTY: MedicineDraft = {
  name: "",
  dose: "",
  frequency: "Once daily",
  time_slots: ["Morning"],
  instructions: "",
  active: true,
};

export function MedicinesEditor({
  patientId,
  actor,
}: {
  patientId: string;
  actor: "doctor" | "patient";
}) {
  const [rows, setRows] = useState<MedicineRow[]>(() =>
    listMedicinesForPatient(patientId),
  );
  const [draft, setDraft] = useState<MedicineDraft>({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setRows(listMedicinesForPatient(patientId));
    refresh();
    return subscribeStore(refresh);
  }, [patientId]);

  const toggleSlot = (slot: string) => {
    setDraft((prev) => {
      const has = prev.time_slots.includes(slot);
      const time_slots = has
        ? prev.time_slots.filter((s) => s !== slot)
        : [...prev.time_slots, slot];
      return {
        ...prev,
        time_slots,
        frequency: frequencyFromSlots(time_slots),
      };
    });
  };

  const save = () => {
    try {
      if (!draft.time_slots.length) {
        throw new Error("Select at least one time: Morning / Lunch / Dinner / Night");
      }
      upsertMedicine(
        patientId,
        editingId
          ? {
              ...draft,
              id: editingId,
              frequency: frequencyFromSlots(draft.time_slots),
            }
          : { ...draft, frequency: frequencyFromSlots(draft.time_slots) },
        actor,
      );
      toast.success(editingId ? "Medicine updated" : "Medicine added");
      setDraft({ ...EMPTY });
      setEditingId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save medicine");
    }
  };

  const startEdit = (med: MedicineRow) => {
    const slots = normalizeSlots(med.time_slots);
    setEditingId(med.id);
    setDraft({
      name: med.name,
      dose: med.dose || "",
      frequency: frequencyFromSlots(slots),
      time_slots: slots.length ? slots : ["Morning"],
      instructions: (med.instructions || "").replace(/\s*\(Updated by patient\)\s*/g, ""),
      active: true,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {editingId ? "Edit medicine" : "Add / change daily medicine"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={draft.name}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, name: e.target.value }))
                }
                placeholder="Metformin"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Dose</Label>
              <Input
                value={draft.dose}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, dose: e.target.value }))
                }
                placeholder="500 mg"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>When to take</Label>
            <div className="flex flex-wrap gap-2">
              {MEAL_SLOTS.map((slot) => {
                const on = draft.time_slots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => toggleSlot(slot)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Derived from slots ({frequencyFromSlots(draft.time_slots)}) — syncs
              for doctor and patient
            </p>
          </div>
          <div className="space-y-1.5">
            <Label>Instructions</Label>
            <Input
              value={draft.instructions}
              onChange={(e) =>
                setDraft((d) => ({ ...d, instructions: e.target.value }))
              }
              placeholder="After food / with water"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save}>
              <Plus className="mr-1 h-4 w-4" />
              {editingId ? "Save changes" : "Add medicine"}
            </Button>
            {editingId ? (
              <Button
                variant="outline"
                onClick={() => {
                  setEditingId(null);
                  setDraft({ ...EMPTY });
                }}
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {rows.filter((r) => r.active).length === 0 ? (
          <p className="text-sm text-muted-foreground">No active medicines yet.</p>
        ) : (
          rows
            .filter((r) => r.active)
            .map((med) => {
              const slots = normalizeSlots(med.time_slots);
              return (
                <Card key={med.id}>
                  <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {[med.dose, frequencyFromSlots(slots)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {slots.map((slot) => (
                          <Badge key={slot} variant="secondary">
                            {slot}
                          </Badge>
                        ))}
                      </div>
                      {med.instructions ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {med.instructions}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(med)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          removeMedicine(patientId, med.id);
                          toast.success("Medicine deactivated");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        )}
      </div>
    </div>
  );
}

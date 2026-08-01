import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { InvestigationPriority } from "@/data/store";
import { INVESTIGATION_CATALOG } from "@/modules/investigations/catalog";
import type { InvestigationDraftInput } from "@/modules/investigations/types";

function dueInDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface InvestigationPickerProps {
  value: InvestigationDraftInput[];
  onChange: (next: InvestigationDraftInput[]) => void;
  disabled?: boolean;
}

export function InvestigationPicker({
  value,
  onChange,
  disabled,
}: InvestigationPickerProps) {
  const [customName, setCustomName] = useState("");
  const selectedNames = useMemo(
    () => new Set(value.map((v) => v.name.toLowerCase())),
    [value],
  );

  const addTemplate = (name: string) => {
    const tpl = INVESTIGATION_CATALOG.find((t) => t.name === name);
    if (!tpl) return;
    if (selectedNames.has(tpl.name.toLowerCase())) return;
    onChange([
      ...value,
      {
        name: tpl.name,
        purpose: tpl.purpose,
        preparation: tpl.preparation,
        priority: tpl.default_priority,
        due_date: dueInDays(tpl.default_due_days),
        notes: "",
      },
    ]);
  };

  const addCustom = () => {
    const name = customName.trim();
    if (!name) return;
    onChange([
      ...value,
      {
        name,
        purpose: "Custom investigation prescribed by doctor",
        preparation: "Follow the lab / imaging center instructions.",
        priority: "important",
        due_date: dueInDays(5),
        notes: "",
      },
    ]);
    setCustomName("");
  };

  const update = (index: number, patch: Partial<InvestigationDraftInput>) => {
    onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/80 bg-muted/20 p-4">
      <div>
        <h3 className="font-display text-lg font-semibold">
          Required Investigations
        </h3>
        <p className="text-sm text-muted-foreground">
          Prescribe post-discharge diagnostics. Patients and caregivers get
          reminders. AI never interprets results.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {INVESTIGATION_CATALOG.map((tpl) => {
          const active = selectedNames.has(tpl.name.toLowerCase());
          return (
            <Button
              key={tpl.name}
              type="button"
              size="sm"
              variant={active ? "secondary" : "outline"}
              disabled={disabled || active}
              onClick={() => addTemplate(tpl.name)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              {tpl.name}
            </Button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={customName}
          disabled={disabled}
          placeholder="Custom investigation"
          onChange={(e) => setCustomName(e.target.value)}
          className="max-w-xs"
        />
        <Button
          type="button"
          variant="outline"
          disabled={disabled || !customName.trim()}
          onClick={addCustom}
        >
          Add custom
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No investigations selected yet.
        </p>
      ) : (
        <div className="space-y-3">
          {value.map((row, index) => (
            <div
              key={`${row.name}-${index}`}
              className="space-y-3 rounded-xl border border-border bg-background p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{row.name}</p>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {row.priority || "routine"}
                  </Badge>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label>Purpose</Label>
                  <Input
                    value={row.purpose || ""}
                    disabled={disabled}
                    onChange={(e) => update(index, { purpose: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={row.due_date}
                    disabled={disabled}
                    onChange={(e) => update(index, { due_date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Priority</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={row.priority || "routine"}
                    disabled={disabled}
                    onChange={(e) =>
                      update(index, {
                        priority: e.target.value as InvestigationPriority,
                      })
                    }
                  >
                    <option value="routine">Routine</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Doctor notes</Label>
                  <Input
                    value={row.notes || ""}
                    disabled={disabled}
                    onChange={(e) => update(index, { notes: e.target.value })}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Preparation (patient-friendly)</Label>
                  <Textarea
                    value={row.preparation || ""}
                    disabled={disabled}
                    rows={2}
                    onChange={(e) =>
                      update(index, { preparation: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

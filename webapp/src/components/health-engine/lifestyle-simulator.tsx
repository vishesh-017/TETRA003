import { motion } from "framer-motion";
import {
  Activity,
  ArrowDownRight,
  Moon,
  Scale,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { LifestyleSimulationResult } from "@/lib/health-engine";
import type { LifestyleHabitRow } from "@/data/store/types";
import { cn } from "@/lib/utils";

export type HabitControls = Omit<
  LifestyleHabitRow,
  "patient_id" | "updated_at"
>;

function riskBadgeClass(level: string) {
  const l = level.toLowerCase();
  if (l === "critical") return "bg-red-100 text-red-700";
  if (l === "high") return "bg-orange-100 text-orange-700";
  if (l === "moderate") return "bg-amber-100 text-amber-800";
  return "bg-emerald-100 text-emerald-700";
}

export function LifestyleSimulator({
  habits,
  onChange,
  result,
}: {
  habits: HabitControls;
  onChange: (next: HabitControls) => void;
  result: LifestyleSimulationResult | null;
}) {
  const weightLabel =
    habits.weight_kg_delta === 0
      ? "No change"
      : habits.weight_kg_delta > 0
        ? `+${habits.weight_kg_delta} kg`
        : `${habits.weight_kg_delta} kg`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display text-xl">Adjust your habits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <HabitSlider
            icon={Activity}
            iconClass="text-emerald-600"
            label="Exercise"
            valueLabel={`${habits.exercise_minutes_week} min/week`}
            min={0}
            max={210}
            step={15}
            value={habits.exercise_minutes_week}
            onChange={(v) => onChange({ ...habits, exercise_minutes_week: v })}
          />
          <HabitSlider
            icon={Moon}
            iconClass="text-violet-600"
            label="Sleep"
            valueLabel={`${habits.sleep_hours} hrs/night`}
            min={4}
            max={10}
            step={0.5}
            value={habits.sleep_hours}
            onChange={(v) => onChange({ ...habits, sleep_hours: v })}
          />
          <HabitSlider
            icon={Scale}
            iconClass="text-orange-600"
            label="Weight change"
            valueLabel={weightLabel}
            min={-5}
            max={5}
            step={0.5}
            value={habits.weight_kg_delta}
            onChange={(v) => onChange({ ...habits, weight_kg_delta: v })}
          />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4 text-rose-600" />
              <Label>Salt intake</Label>
            </div>
            <Select
              value={habits.salt_level}
              onChange={(e) =>
                onChange({
                  ...habits,
                  salt_level: e.target.value as HabitControls["salt_level"],
                })
              }
            >
              <option value="low">Low salt</option>
              <option value="medium">Medium salt</option>
              <option value="high">High salt</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <Label>Sugar control</Label>
            </div>
            <Select
              value={habits.sugar_control}
              onChange={(e) =>
                onChange({
                  ...habits,
                  sugar_control: e.target
                    .value as HabitControls["sugar_control"],
                })
              }
            >
              <option value="good">Good — mostly on track</option>
              <option value="average">Average — sometimes skip</option>
              <option value="poor">Poor — frequent spikes</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle className="font-display text-xl">Before vs. after</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <motion.div
              key={`${result.after.recovery_score}-${result.peak_risk_drop}`}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className={cn(
                    "capitalize",
                    riskBadgeClass(result.before.risk_category),
                  )}
                >
                  {result.before.risk_category}
                </Badge>
                <span className="text-muted-foreground">→</span>
                <Badge
                  className={cn(
                    "capitalize",
                    riskBadgeClass(result.after.risk_category),
                  )}
                >
                  {result.after.risk_category}
                </Badge>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
                <ArrowDownRight className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {(() => {
                    const combinedDrop = result.disease_scores.reduce(
                      (sum, d) => sum + Math.max(0, -d.delta),
                      0,
                    );
                    const peakLabel =
                      result.peak_risk_drop > 0
                        ? `Peak risk would drop by ${result.peak_risk_drop} points.`
                        : `Peak risk stays ${Math.max(
                            ...result.disease_scores.map((d) => d.after),
                            0,
                          )} (highest disease score). Combined scores improve by ${combinedDrop} points.`;
                    const rec =
                      result.deltas.recovery_score !== 0
                        ? ` Recovery Score ${
                            result.deltas.recovery_score > 0 ? "↑" : "↓"
                          } ${Math.abs(result.deltas.recovery_score).toFixed(0)}.`
                        : "";
                    const band =
                      result.before.risk_category !== result.after.risk_category
                        ? ` Risk band ${result.before.risk_category} → ${result.after.risk_category}.`
                        : "";
                    return `${peakLabel}${rec}${band}`;
                  })()}
                </p>
              </div>

              <div className="space-y-3">
                {result.disease_scores.map((row) => (
                  <div key={row.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{row.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {row.before} → {row.after} ({row.delta >= 0 ? "+" : ""}
                        {row.delta})
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(4, row.after))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900">
                This is an educational estimate using simplified rules — not a
                medical prediction. Always follow your doctor&apos;s advice.
              </p>
            </motion.div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Load patient observations to simulate lifestyle changes.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HabitSlider({
  icon: Icon,
  iconClass,
  label,
  valueLabel,
  min,
  max,
  step,
  value,
  onChange,
}: {
  icon: typeof Activity;
  iconClass: string;
  label: string;
  valueLabel: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", iconClass)} />
          <Label>{label}</Label>
        </div>
        <span className="tabular-nums text-muted-foreground">{valueLabel}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="w-full accent-[hsl(var(--primary))]"
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type {
  LifestyleAdjustments,
  LifestyleSimulationResponse,
} from "@/modules/prediction/types";

const SLIDERS: Array<{
  key: keyof LifestyleAdjustments;
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "exercise_minutes_delta", label: "Exercise (min Δ)", min: -20, max: 40, step: 5 },
  { key: "sleep_hours_delta", label: "Sleep (hours Δ)", min: -2, max: 3, step: 0.5 },
  { key: "water_intake_delta", label: "Water (glasses Δ)", min: -3, max: 5, step: 1 },
  {
    key: "medicine_adherence_delta",
    label: "Medicine adherence (% Δ)",
    min: -30,
    max: 30,
    step: 5,
  },
  { key: "weight_kg_delta", label: "Weight (kg Δ)", min: -3, max: 3, step: 0.5 },
];

export function LifestylePanel({
  adjustments,
  onChange,
  onRun,
  pending,
  result,
}: {
  adjustments: LifestyleAdjustments;
  onChange: (next: LifestyleAdjustments) => void;
  onRun: () => void;
  pending?: boolean;
  result?: LifestyleSimulationResponse;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Lifestyle Simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {SLIDERS.map((s) => (
            <div key={s.key} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <Label>{s.label}</Label>
                <span className="tabular-nums text-muted-foreground">
                  {adjustments[s.key]}
                </span>
              </div>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={adjustments[s.key]}
                className="w-full accent-[hsl(var(--primary))]"
                onChange={(e) =>
                  onChange({
                    ...adjustments,
                    [s.key]: Number(e.target.value),
                  })
                }
              />
            </div>
          ))}
          <Button onClick={onRun} disabled={pending} className="w-full">
            {pending ? "Simulating…" : "Run simulation"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Before vs After</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metric
                  label="Recovery (before)"
                  value={result.before.recovery_score}
                />
                <Metric
                  label="Recovery (after)"
                  value={result.after.recovery_score}
                />
                <Metric
                  label="Readmit % (before)"
                  value={result.before.readmission_probability_percent}
                />
                <Metric
                  label="Readmit % (after)"
                  value={result.after.readmission_probability_percent}
                />
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.chart_series}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={32} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="before" fill="hsl(var(--muted-foreground))" />
                    <Bar dataKey="after" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground">{result.interpretation}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Adjust lifestyle levers and run the simulation to see projected Recovery
              Score and readmission risk.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold">{value.toFixed(0)}</p>
    </div>
  );
}

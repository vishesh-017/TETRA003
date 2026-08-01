import { motion } from "framer-motion";
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type {
  LifestyleAdjustments,
  LifestyleSimulationResult,
} from "@/lib/health-engine";

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

export function LifestyleSimulator({
  adjustments,
  onChange,
  result,
}: {
  adjustments: LifestyleAdjustments;
  onChange: (next: LifestyleAdjustments) => void;
  result: LifestyleSimulationResult | null;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Lifestyle Simulator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Adjust habits — Recovery Score and risk update instantly. Educational only.
          </p>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Before vs After</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {result ? (
            <motion.div
              key={`${result.after.recovery_score}-${result.after.readmission_probability_percent}`}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Recovery (before)" value={result.before.recovery_score} />
                <Metric label="Recovery (after)" value={result.after.recovery_score} />
                <Metric
                  label="Readmit % (before)"
                  value={result.before.readmission_probability_percent}
                />
                <Metric
                  label="Readmit % (after)"
                  value={result.after.readmission_probability_percent}
                />
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="capitalize">
                  Risk: {result.after.risk_category}
                </span>
                <span>·</span>
                <span className="capitalize">
                  Progression: {result.after.overall_worsening_risk}
                </span>
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

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-semibold">{value.toFixed(0)}</p>
    </div>
  );
}

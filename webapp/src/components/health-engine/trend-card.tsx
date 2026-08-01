import { motion } from "framer-motion";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClinicalTrend, TrendAnalysisResult, TrendItem } from "@/lib/health-engine";

const TREND_VARIANT: Record<
  ClinicalTrend,
  "secondary" | "default" | "warning" | "outline"
> = {
  improving: "secondary",
  stable: "outline",
  declining: "warning",
  insufficient: "default",
};

export function TrendCard({ trends }: { trends: TrendAnalysisResult }) {
  const chartable = trends.trends.filter(
    (t) => t.points.length >= 2 && t.metric !== "medicine_adherence",
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trend narrative</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p className="text-foreground">{trends.narrative_summary}</p>
          {trends.trends.map((t) => (
            <TrendRow key={t.metric} item={t} />
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {chartable.slice(0, 4).map((t, i) => (
          <motion.div
            key={t.metric}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Card>
              <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
                <CardTitle className="text-base">{t.label}</CardTitle>
                <Badge
                  variant={TREND_VARIANT[t.clinical_trend]}
                  className="capitalize"
                >
                  {t.clinical_trend}
                </Badge>
              </CardHeader>
              <CardContent className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={t.points}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={36} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TrendRow({ item }: { item: TrendItem }) {
  return (
    <p>
      <span className="font-medium text-foreground">{item.label}:</span>{" "}
      {item.natural_language}
    </p>
  );
}

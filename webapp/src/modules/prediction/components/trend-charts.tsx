import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TrendItem } from "@/modules/prediction/types";

/** Legacy charts — prefer TrendCard from @/components/health-engine. */
export function TrendCharts({ trends }: { trends: TrendItem[] }) {
  const chartable = trends.filter(
    (t) => t.points.length >= 2 && t.metric !== "medicine_adherence",
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trend narrative</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          {trends.map((t) => (
            <p key={t.metric}>
              <span className="font-medium text-foreground">{t.label}:</span>{" "}
              {t.natural_language}
            </p>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {chartable.slice(0, 4).map((t) => (
          <Card key={t.metric}>
            <CardHeader>
              <CardTitle className="text-base">{t.label}</CardTitle>
            </CardHeader>
            <CardContent className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={t.points}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
        ))}
      </div>
    </div>
  );
}

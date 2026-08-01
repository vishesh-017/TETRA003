import { motion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  ExplanationResult,
  RecoveryScoreResult,
} from "@/lib/health-engine";

export function InsightsPanel({
  explain,
  recovery,
}: {
  explain?: ExplanationResult | null;
  recovery?: RecoveryScoreResult | null;
}) {
  if (!explain && !recovery) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {explain ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">{explain.why.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {explain.why.bullets.map((b) => (
                  <li key={b}>• {b}</li>
                ))}
              </ul>
              {explain.what_changed.length ? (
                <div className="mt-4 space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  {explain.what_changed.map((c) => (
                    <p key={c}>{c}</p>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </motion.div>
      ) : null}

      {recovery ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Contributing factors</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {recovery.contributing_factors.map((f) => (
                <div
                  key={f.factor}
                  className="rounded-xl border border-border px-3 py-2 text-sm"
                >
                  <p className="font-medium capitalize">
                    {f.factor.replaceAll("_", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">{f.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      ) : null}
    </div>
  );
}

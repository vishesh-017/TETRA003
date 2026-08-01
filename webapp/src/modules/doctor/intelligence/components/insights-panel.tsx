import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import type {
  AiInsightCard,
  SuggestedAction,
} from "@/modules/doctor/intelligence/types";

const ACTION: Record<SuggestedAction, string> = {
  monitor: "Monitor",
  schedule_followup: "Schedule follow-up",
  immediate_review: "Immediate review",
};

export function InsightsPanelIntel({ insights }: { insights: AiInsightCard[] }) {
  return (
    <section className="rounded-3xl border border-border/80 bg-card/70 p-5 shadow-soft backdrop-blur">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-semibold">AI Insights</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Concise, actionable signals — assistive only.
      </p>
      <div className="mt-3">
        <AiDisclaimer />
      </div>
      <div className="mt-4 space-y-3">
        {insights.length ? (
          insights.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border/70 bg-background/60 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">{item.patient_name}</p>
                <Badge variant="outline">{ACTION[item.suggested_action]}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
              <Link
                to={`/doctor/patients/${item.patient_id}?tab=ai`}
                className="mt-2 inline-block text-sm text-primary"
              >
                View summary →
              </Link>
            </motion.div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            No elevated insights right now.
          </p>
        )}
      </div>
    </section>
  );
}

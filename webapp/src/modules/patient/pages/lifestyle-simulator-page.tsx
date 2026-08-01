import { FlaskConical } from "lucide-react";
import { Link } from "react-router-dom";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { LifestyleSimulator } from "@/components/health-engine";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useLifestyleSimulation } from "@/hooks/health-engine";
import { cn } from "@/lib/utils";

export function LifestyleSimulatorPage() {
  const sim = useLifestyleSimulation();
  const delta = sim.result?.deltas.recovery_score ?? 0;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 pb-10">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F3D4C] via-[#0F766E] to-[#134E4A] p-6 text-white sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
              <FlaskConical className="h-3.5 w-3.5" />
              Lifestyle simulator
            </p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              What if you changed one habit?
            </h1>
            <p className="mt-2 text-sm text-white/80">
              Move the sliders to see how exercise, sleep, salt, sugar control,
              and weight could shift your risk scores — based on your latest
              recorded vitals. Changes update your live AI Recovery Score across
              the app.
            </p>
            <Link
              to="/patient/care-plan"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "mt-4 border-white/30 bg-white/10 text-white hover:bg-white/20",
              )}
            >
              ← Care plan
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[10px] uppercase tracking-wide text-white/60">
                Risk delta
              </p>
              <p className="font-display text-2xl font-semibold">
                {sim.result?.peak_risk_drop ?? 0}
              </p>
              <p className="text-xs text-white/70">
                {delta > 0 ? "Improving" : delta < 0 ? "Worsening" : "Stable"}
              </p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-[10px] uppercase tracking-wide text-white/60">
                After
              </p>
              <Badge className="mt-1 capitalize bg-white/20 text-white">
                {sim.result?.after.risk_category ?? "—"}
              </Badge>
              <p className="mt-1 text-xs text-white/70">
                Was {sim.result?.before.risk_category ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <AiDisclaimer />
      <LifestyleSimulator
        habits={sim.habits}
        onChange={sim.setHabits}
        result={sim.result}
      />
    </div>
  );
}

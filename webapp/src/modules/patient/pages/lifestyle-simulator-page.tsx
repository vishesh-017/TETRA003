import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { LifestyleSimulator } from "@/components/health-engine";
import { useLifestyleSimulation } from "@/hooks/health-engine";

export function LifestyleSimulatorPage() {
  const sim = useLifestyleSimulation();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 pb-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">
          Lifestyle Simulator
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explore how habit changes may project Recovery Score and readmission
          risk. Updates instantly — educational only, never a prescription.
        </p>
      </div>
      <AiDisclaimer />
      <LifestyleSimulator
        adjustments={sim.adjustments}
        onChange={sim.setAdjustments}
        result={sim.result}
      />
    </div>
  );
}

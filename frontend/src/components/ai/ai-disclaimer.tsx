import { Badge } from "@/components/ui/badge";

export function AiDisclaimer() {
  return (
    <div className="rounded-xl border border-border bg-accent/60 px-4 py-3 text-sm text-accent-foreground">
      <div className="mb-1 flex items-center gap-2">
        <Badge variant="secondary">Assistive</Badge>
        <span className="font-medium">AI does not replace your doctor</span>
      </div>
      <p className="text-muted-foreground">
        HealNexus AI organizes, educates, monitors, and summarizes. It never
        diagnoses disease or prescribes medicines.
      </p>
    </div>
  );
}

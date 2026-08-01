import { Badge } from "@/components/ui/badge";
import { AI_CARE_COMPANION_LABEL } from "@/types/domain";

export function AiDisclaimer() {
  return (
    <div className="rounded-xl border border-border bg-accent/60 px-4 py-3 text-sm text-accent-foreground">
      <div className="mb-1 flex items-center gap-2">
        <Badge variant="secondary">Assistive</Badge>
        <span className="font-medium">{AI_CARE_COMPANION_LABEL}</span>
      </div>
      <p className="text-muted-foreground">
        Organizes discharge plans, summarizes history, explains reports, educates,
        and highlights risk trends. It never diagnoses patients, prescribes
        medicines, or replaces doctors.
      </p>
    </div>
  );
}

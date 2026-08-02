import { useMemo } from "react";

import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { useCaregiver } from "@/modules/caregiver/context";
import { topicFromConditions } from "@/modules/education/catalog";
import { WatchLearnHub } from "@/modules/education/watch-learn-hub";

export function CaregiverEducationPage() {
  const { selected, family } = useCaregiver();
  const conditionBits = useMemo(
    () =>
      (selected?.conditionSummary || "")
        .split(/[;,/]| and /i)
        .map((s) => s.trim())
        .filter(Boolean),
    [selected?.conditionSummary],
  );
  const defaultTopic = useMemo(
    () => topicFromConditions(conditionBits),
    [conditionBits],
  );
  const suggested = useMemo(() => {
    const name = selected?.name || "your family";
    if (!conditionBits.length) return `Family care for ${name}`;
    return `${conditionBits.slice(0, 2).join(" with ")} · caring for ${name}`;
  }, [conditionBits, selected?.name]);

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Caregiver education
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Learn to care with confidence
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Diets, medicines, warning signs and clear care steps for families — in
          EN, HI and GU. Content is tuned for caregivers
          {family.length > 1 ? ` looking after ${family.length} members` : ""}.
        </p>
      </div>

      <FamilySwitcher />

      <WatchLearnHub
        audience="caregiver"
        suggestedLabel={suggested}
        defaultTopic={defaultTopic}
      />
    </div>
  );
}

import { Construction } from "lucide-react";

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/ui/page-header";

interface ModulePlaceholderProps {
  title: string;
  description: string;
  showAiDisclaimer?: boolean;
}

export function ModulePlaceholder({
  title,
  description,
  showAiDisclaimer = false,
}: ModulePlaceholderProps) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title={title} description={description} eyebrow="Coming soon" />
      <EmptyState
        icon={Construction}
        title="This view is prepared"
        description="The experience shell is ready. Live workflows for this role will appear here without changing the rest of HealNexus."
      />
      {showAiDisclaimer ? <AiDisclaimer /> : null}
    </div>
  );
}

import { AiDisclaimer } from "@/components/ai/ai-disclaimer";
import { EmptyState } from "@/components/feedback/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmptyState
            title="Module scaffold ready"
            description="Routing, layout, and design system are in place. Business logic will be implemented in later phases."
          />
          {showAiDisclaimer ? <AiDisclaimer /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

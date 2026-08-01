import { FeaturesSection } from "@/modules/marketing/components/features";
import { HowItWorksSection } from "@/modules/marketing/components/how-it-works";

export function FeaturesPage() {
  return (
    <div className="pt-6">
      <FeaturesSection />
      <HowItWorksSection />
    </div>
  );
}

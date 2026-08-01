import { FaqSection } from "@/modules/marketing/components/faq";
import { PricingSection } from "@/modules/marketing/components/pricing";

export function PricingPage() {
  return (
    <div className="pt-6">
      <PricingSection />
      <FaqSection />
    </div>
  );
}

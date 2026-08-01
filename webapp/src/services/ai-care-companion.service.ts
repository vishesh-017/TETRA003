/**
 * AI Care Companion status probe for the UI shell.
 */

import { isAiServiceConfigured } from "@/services/ai.service";
import { AI_CARE_COMPANION_LABEL } from "@/types/domain";

export { AI_CARE_COMPANION_LABEL };

export interface CareCompanionScaffoldResponse {
  provider: string;
  assistive: boolean;
  disclaimer: string;
  status: string;
}

export async function getCareCompanionStatus(): Promise<CareCompanionScaffoldResponse> {
  return {
    provider: isAiServiceConfigured() ? "ai-service" : "stub",
    assistive: true,
    disclaimer:
      "AI Care Companion is assistive only. It never diagnoses, prescribes, or replaces doctors.",
    status: isAiServiceConfigured() ? "ready" : "scaffold",
  };
}

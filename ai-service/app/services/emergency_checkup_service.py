"""Emergency symptom triage via OpenRouter — assistive only, never diagnoses."""

from __future__ import annotations

import json
import re

from app.core.constants import CLINICAL_DISCLAIMER
from app.core.errors import ProviderUnavailableError
from app.core.logging import get_logger
from app.providers.openrouter_provider import OpenRouterLLM
from app.schemas.common import AiMeta
from app.schemas.emergency_checkup import (
    DiseaseRiskItem,
    EmergencyCheckupRequest,
    EmergencyCheckupResponse,
    MissingInvestigationItem,
)

logger = get_logger(__name__)

SYSTEM = (
    "You are HealNexus emergency triage assistant for India. "
    "The patient describes sudden symptoms. Estimate urgency only — "
    "never diagnose, never prescribe, never invent vitals. "
    "Return ONLY valid JSON with keys: "
    "title (string), summary (string), criticality (low|moderate|high|critical), "
    "criticality_score (0-100 integer), is_emergency (boolean), "
    "warning_signals (string array), next_actions (string array 3-5 items), "
    "when_to_call_108 (string array), early_warnings (string array about "
    "complication risk), disease_risk_hints (object with keys diabetes, "
    "hypertension, ckd, cardiovascular, stroke each 0-100), "
    "referral_specialty (string), referral_urgency (emergency|urgent|soon|routine), "
    "referral_message (string). "
    "Use patient_context if provided. Shivering/tremor with diabetes context "
    "may raise metabolic concern. Chest pain / breathlessness / stroke signs "
    "must score high/critical."
)


def _band(score: int) -> str:
    if score >= 70:
        return "critical"
    if score >= 50:
        return "high"
    if score >= 30:
        return "moderate"
    return "low"


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{[\s\S]*\}", text)
        if match:
            return json.loads(match.group(0))
        raise


class EmergencyCheckupService:
    module_name = "emergency_checkup"

    def __init__(self, llm: OpenRouterLLM | None = None) -> None:
        self._llm = llm or OpenRouterLLM()

    async def assess(
        self, payload: EmergencyCheckupRequest
    ) -> EmergencyCheckupResponse:
        symptoms = payload.symptoms.strip()
        if not self._llm.configured:
            raise ProviderUnavailableError(
                "openrouter",
                "OPENROUTER_API_KEY is not configured on the AI service.",
            )

        prompt = (
            f"Patient sudden symptoms:\n{symptoms}\n\n"
            f"Patient context (may be empty):\n{payload.patient_context or 'none'}\n\n"
            "Respond with JSON only."
        )

        raw = await self._llm.complete(
            prompt,
            system=SYSTEM,
            temperature=0.2,
            max_tokens=900,
        )
        data = _extract_json(raw)

        score = int(data.get("criticality_score", 40))
        score = max(0, min(100, score))
        criticality = str(data.get("criticality") or _band(score)).lower()
        if criticality not in ("low", "moderate", "high", "critical"):
            criticality = _band(score)

        hints = data.get("disease_risk_hints") or {}
        labels = {
            "diabetes": "Diabetes",
            "hypertension": "Hypertension",
            "ckd": "CKD",
            "cardiovascular": "Cardiovascular",
            "stroke": "Stroke",
        }
        disease_risks: list[DiseaseRiskItem] = []
        for key, label in labels.items():
            s = int(hints.get(key, 0) or 0)
            s = max(0, min(100, s))
            disease_risks.append(
                DiseaseRiskItem(
                    key=key, label=label, score=s, band=_band(s)  # type: ignore[arg-type]
                )
            )

        referral = {
            "recommended": criticality in ("high", "critical")
            or str(data.get("referral_urgency", "")) in ("emergency", "urgent"),
            "urgency": data.get("referral_urgency") or "routine",
            "specialty": data.get("referral_specialty") or "General medicine / ER",
            "message": data.get("referral_message")
            or "Follow next actions and contact your clinician if unsure.",
        }

        return EmergencyCheckupResponse(
            title=str(data.get("title") or "Symptom assessment"),
            summary=str(data.get("summary") or ""),
            criticality=criticality,  # type: ignore[arg-type]
            criticality_score=score,
            is_emergency=bool(
                data.get("is_emergency")
                if data.get("is_emergency") is not None
                else criticality in ("high", "critical")
            ),
            warning_signals=list(data.get("warning_signals") or [])[:8],
            next_actions=list(data.get("next_actions") or [])[:6],
            when_to_call_108=list(data.get("when_to_call_108") or [])[:6],
            early_warnings=list(data.get("early_warnings") or [])[:6],
            disease_risks=disease_risks,
            missing_investigations=[],
            referral=referral,
            provider=f"openrouter:{self._llm.model}",
            disclaimer=CLINICAL_DISCLAIMER,
            meta=AiMeta(
                module=self.module_name,
                provider="openrouter",
                model_hint=self._llm.model,
            ),
        )

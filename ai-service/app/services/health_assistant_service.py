"""AI Health Assistant — Exa-backed educational answers. No diagnosis."""

from __future__ import annotations

from app.core.constants import CLINICAL_DISCLAIMER, TRUSTED_MEDICAL_DOMAINS
from app.core.errors import ProviderUnavailableError, SafetyViolationError
from app.core.logging import get_logger
from app.providers.base import KnowledgeProvider
from app.providers.factory import get_fallback_knowledge_provider
from app.schemas.common import AiMeta
from app.schemas.health_assistant import (
    HealthAssistantRequest,
    HealthAssistantResponse,
    SourceRef,
)

logger = get_logger(__name__)

DIAGNOSIS_PATTERNS = (
    "do i have",
    "diagnose me",
    "what disease",
    "which medicine should i take",
    "prescribe",
    "dosage for me",
    "am i dying",
)


class HealthAssistantService:
    module_name = "health_assistant"

    def __init__(self, knowledge: KnowledgeProvider) -> None:
        self._knowledge = knowledge
        self._fallback = get_fallback_knowledge_provider()

    async def answer(
        self,
        payload: HealthAssistantRequest,
    ) -> HealthAssistantResponse:
        q = payload.question.strip()
        lowered = q.lower()
        if any(p in lowered for p in DIAGNOSIS_PATTERNS):
            raise SafetyViolationError(
                "I can't diagnose conditions or prescribe medicines. "
                "Ask about general recovery education, or contact your doctor for clinical decisions."
            )

        query = (
            f"patient recovery education: {q}. "
            "trusted medical guidance lifestyle diet medicine adherence warning signs"
        )
        if payload.patient_context:
            query += f" Context: {payload.patient_context[:300]}"

        provider_name = self._knowledge.name
        try:
            bundle = await self._knowledge.search(
                query,
                num_results=5,
                include_domains=TRUSTED_MEDICAL_DOMAINS,
            )
        except ProviderUnavailableError:
            logger.warning("Primary knowledge provider failed; using fallback")
            bundle = await self._fallback.search(query, num_results=3)
            provider_name = bundle.provider

        if not bundle.hits:
            bundle = await self._fallback.search(query, num_results=3)
            provider_name = bundle.provider

        sources = [
            SourceRef(title=h.title, url=h.url, snippet=h.snippet)
            for h in bundle.hits
            if h.url or h.snippet
        ]
        summary, points = self._synthesize(q, sources)

        return HealthAssistantResponse(
            summary=summary,
            key_points=points,
            when_to_contact_doctor=[
                "Chest pain, severe breathlessness, fainting, or confusion",
                "Symptoms rapidly worsen despite following your care plan",
                "You cannot take medicines as prescribed (vomiting, severe side effects)",
                "Blood sugar / BP readings far outside the range your doctor set",
            ],
            disclaimer=CLINICAL_DISCLAIMER,
            sources=sources,
            meta=AiMeta(
                module=self.module_name,
                provider=provider_name,
                model_hint="exa_search_extractive_v1",
            ),
        )

    def _synthesize(
        self,
        question: str,
        sources: list[SourceRef],
    ) -> tuple[str, list[str]]:
        snippets = [s.snippet.strip() for s in sources if s.snippet.strip()]
        if not snippets:
            summary = (
                f"Regarding “{question[:120]}”: follow your doctor-approved care plan, "
                "use trusted medical education sources, and contact your clinician for "
                "personal medical decisions."
            )
            points = [
                "This assistant provides general education only",
                "Do not change medicines without clinician advice",
                "Seek urgent care for emergency warning signs",
            ]
            return summary, points

        # Extractive: first snippet becomes summary backbone; others become key points
        summary = (
            f"{snippets[0][:420]} "
            "This is general education grounded in retrieved sources — not a diagnosis."
        )
        points = []
        for snip in snippets[:4]:
            sentence = snip.split(".")[0].strip()
            if sentence and sentence not in points:
                points.append(sentence[:180])
        if len(points) < 3:
            points.extend(
                [
                    "Take medicines exactly as written by your doctor",
                    "Track vitals and symptoms daily during recovery",
                    "Contact a clinician if warning signs appear",
                ]
            )
        return summary, points[:5]

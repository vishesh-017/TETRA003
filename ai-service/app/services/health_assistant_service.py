"""AI Health Assistant — Exa search + OpenRouter synthesis. No diagnosis."""

from __future__ import annotations

import json
import re

from app.core.config import get_settings
from app.core.constants import CLINICAL_DISCLAIMER, TRUSTED_MEDICAL_DOMAINS
from app.core.errors import ProviderUnavailableError, SafetyViolationError
from app.core.logging import get_logger
from app.providers.base import KnowledgeProvider
from app.providers.factory import get_fallback_knowledge_provider
from app.providers.openrouter_provider import OpenRouterLLM
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

    def __init__(
        self,
        knowledge: KnowledgeProvider,
        llm: OpenRouterLLM | None = None,
    ) -> None:
        self._knowledge = knowledge
        self._fallback = get_fallback_knowledge_provider()
        self._llm = llm or OpenRouterLLM(get_settings())

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

        summary, points, model_hint = await self._synthesize(q, sources)
        if self._llm.configured and "openrouter" in model_hint:
            provider_name = f"{provider_name}+openrouter"

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
                model_hint=model_hint,
            ),
        )

    async def _synthesize(
        self,
        question: str,
        sources: list[SourceRef],
    ) -> tuple[str, list[str], str]:
        if self._llm.configured:
            try:
                return await self._synthesize_with_llm(question, sources)
            except ProviderUnavailableError as exc:
                logger.warning("OpenRouter synthesis failed: %s", exc.detail)

        summary, points = self._synthesize_extractive(question, sources)
        return summary, points, "exa_search_extractive_v1"

    async def _synthesize_with_llm(
        self,
        question: str,
        sources: list[SourceRef],
    ) -> tuple[str, list[str], str]:
        source_block = "\n".join(
            f"- {s.title}: {s.snippet[:280]}" for s in sources[:5] if s.snippet
        ) or "- No external snippets; use general post-discharge education only."

        prompt = (
            "Answer the patient's recovery education question using the sources.\n"
            "Return ONLY valid JSON with keys: summary (string), key_points (array of 3-5 short strings).\n"
            "Do not diagnose or prescribe.\n\n"
            f"Question: {question}\n\n"
            f"Sources:\n{source_block}"
        )
        raw = await self._llm.complete(prompt, temperature=0.25, max_tokens=500)
        summary, points = self._parse_llm_json(raw, question, sources)
        return summary, points, f"openrouter:{self._llm.model}"

    def _parse_llm_json(
        self,
        raw: str,
        question: str,
        sources: list[SourceRef],
    ) -> tuple[str, list[str]]:
        text = raw.strip()
        fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
        if fenced:
            text = fenced.group(1).strip()
        try:
            data = json.loads(text)
            summary = str(data.get("summary") or "").strip()
            points = [
                str(p).strip()
                for p in (data.get("key_points") or [])
                if str(p).strip()
            ]
            if summary and points:
                if "not a diagnosis" not in summary.lower():
                    summary += " This is general education — not a diagnosis."
                return summary, points[:5]
        except json.JSONDecodeError:
            logger.warning("OpenRouter JSON parse failed; using extractive fallback")
        return self._synthesize_extractive(question, sources)

    def _synthesize_extractive(
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

        summary = (
            f"{snippets[0][:420]} "
            "This is general education grounded in retrieved sources — not a diagnosis."
        )
        points: list[str] = []
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

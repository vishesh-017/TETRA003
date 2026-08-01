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

        # Prefer HealNexus DB context (hospitals / patient record) over web search
        # so we never invent facilities outside the app registry.
        db_answer = self._answer_from_healnexus_db(q, payload.patient_context)
        if db_answer is not None:
            summary, points, sources = db_answer
            return HealthAssistantResponse(
                summary=summary,
                key_points=points,
                when_to_contact_doctor=[
                    "Chest pain, severe breathlessness, fainting, or confusion",
                    "Verify PM-JAY packages at the hospital help desk / call 14555",
                    "You cannot take medicines as prescribed (vomiting, severe side effects)",
                    "Blood sugar / BP readings far outside the range your doctor set",
                ],
                disclaimer=CLINICAL_DISCLAIMER,
                sources=sources,
                meta=AiMeta(
                    module=self.module_name,
                    provider="healnexus-db",
                    model_hint="patient_context_v1",
                ),
            )

        query = (
            f"patient recovery education: {q}. "
            "trusted medical guidance lifestyle diet medicine adherence warning signs"
        )
        if payload.patient_context:
            query += f" Context: {payload.patient_context[:800]}"

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

        summary, points, model_hint = await self._synthesize(
            q, sources, payload.patient_context
        )
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

    def _answer_from_healnexus_db(
        self,
        question: str,
        patient_context: str | None,
    ) -> tuple[str, list[str], list[SourceRef]] | None:
        if not patient_context:
            return None
        lowered = question.lower()
        factual = any(
            k in lowered
            for k in (
                "hospital",
                "pm-jay",
                "pmjay",
                "ayushman",
                "opd",
                "empanel",
                "medicine",
                "appointment",
                "lab",
                "investig",
            )
        )
        if not factual and "healnexus-database" not in patient_context:
            return None
        try:
            data = json.loads(patient_context)
        except json.JSONDecodeError:
            return None
        if data.get("source") != "healnexus-database":
            return None

        hospitals = data.get("hospitals") or []
        patient = data.get("patient") or {}
        pmjay = data.get("pmjay")
        points: list[str] = []

        if any(k in lowered for k in ("hospital", "opd", "pm-jay", "pmjay", "ayushman", "empanel")):
            if not hospitals:
                return None
            want_opd = "opd" in lowered
            want_pmjay = any(k in lowered for k in ("pm-jay", "pmjay", "ayushman", "empanel"))
            filtered = hospitals
            if want_pmjay:
                filtered = [h for h in hospitals if h.get("pmjay_empanelled")]
            if want_opd:
                filtered = [
                    h
                    for h in filtered
                    if h.get("opd_support")
                    or "opd" in " ".join(h.get("pmjay_departments") or []).lower()
                    or "opd" in " ".join(h.get("services") or []).lower()
                ] or filtered
            filtered = filtered[:6]
            summary = (
                f"From the HealNexus hospital database ({len(filtered)} matches) in Ahmedabad. "
                + (
                    f"Your saved PM-JAY status is {pmjay.get('status')}."
                    if pmjay
                    else "Complete Benefits → PM-JAY in the app to save eligibility."
                )
                + " Verify packages at the hospital help desk — not a live government API."
            )
            for h in filtered:
                depts = ", ".join((h.get("pmjay_departments") or [])[:3])
                bits = [
                    h.get("name"),
                    h.get("area"),
                    "PM-JAY" if h.get("pmjay_empanelled") else "not PM-JAY",
                    "OPD" if h.get("opd_support") else None,
                    h.get("phone"),
                ]
                line = " · ".join(str(b) for b in bits if b)
                points.append(f"{line} — {depts}" if depts else line)
            sources = [
                SourceRef(
                    title="HealNexus hospital registry",
                    url="/maps",
                    snippet=summary[:240],
                )
            ]
            return summary, points[:6], sources

        if patient:
            name = patient.get("name") or "Patient"
            summary = (
                f"{name}: recovery {patient.get('recovery_score')}, "
                f"risk {patient.get('risk_level')} — answered from HealNexus patient record."
            )
            meds = patient.get("medicines") or []
            for m in meds[:5]:
                if isinstance(m, dict):
                    slots = ", ".join(m.get("time_slots") or []) or m.get("frequency") or "as directed"
                    points.append(
                        f"{m.get('name')} {m.get('dose') or ''} · {slots}".strip()
                    )
            if pmjay:
                points.append(f"PM-JAY status on file: {pmjay.get('status')}")
            if points:
                return (
                    summary,
                    points[:6],
                    [
                        SourceRef(
                            title="HealNexus patient database",
                            url="/patient",
                            snippet=summary[:240],
                        )
                    ],
                )
        return None

    async def _synthesize(
        self,
        question: str,
        sources: list[SourceRef],
        patient_context: str | None = None,
    ) -> tuple[str, list[str], str]:
        if self._llm.configured:
            try:
                return await self._synthesize_with_llm(
                    question, sources, patient_context
                )
            except ProviderUnavailableError as exc:
                logger.warning("OpenRouter synthesis failed: %s", exc.detail)

        summary, points = self._synthesize_extractive(question, sources)
        return summary, points, "exa_search_extractive_v1"

    async def _synthesize_with_llm(
        self,
        question: str,
        sources: list[SourceRef],
        patient_context: str | None = None,
    ) -> tuple[str, list[str], str]:
        source_block = "\n".join(
            f"- {s.title}: {s.snippet[:280]}" for s in sources[:5] if s.snippet
        ) or "- No external snippets; use general post-discharge education only."
        db_block = (patient_context or "")[:1200]

        prompt = (
            "Answer the patient's recovery education question.\n"
            "If HealNexus database context is provided, prefer those hospitals/"
            "medicines/labs over web sources — never invent hospitals outside it.\n"
            "Return ONLY valid JSON with keys: summary (string), key_points (array of 3-5 short strings).\n"
            "Do not diagnose or prescribe.\n\n"
            f"Question: {question}\n\n"
            f"HealNexus database context:\n{db_block or '(none)'}\n\n"
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

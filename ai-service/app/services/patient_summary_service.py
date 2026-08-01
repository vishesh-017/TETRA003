"""AI Patient Summary — short assistive clinical narrative. Never diagnoses."""

from __future__ import annotations

import json
import re

from app.core.config import get_settings
from app.core.errors import ProviderUnavailableError
from app.core.logging import get_logger
from app.providers.openrouter_provider import OpenRouterLLM
from app.schemas.common import AiMeta
from app.schemas.patient_summary import (
    PatientSummaryRequest,
    PatientSummaryResponse,
)

logger = get_logger(__name__)


class PatientSummaryService:
    module_name = "patient_summary"

    def __init__(self, llm: OpenRouterLLM | None = None) -> None:
        self._llm = llm or OpenRouterLLM(get_settings())

    async def summarize(
        self, payload: PatientSummaryRequest
    ) -> PatientSummaryResponse:
        logger.info(
            "PatientSummary name=%r vitals=%s checkins=%s meds=%s",
            payload.patient_name,
            len(payload.vitals),
            len(payload.checkins),
            len(payload.medicines),
        )

        rules = self._summarize_rules(payload)
        if self._llm.configured:
            try:
                llm = await self._summarize_with_llm(payload, rules)
                if llm:
                    return llm
            except ProviderUnavailableError as exc:
                logger.warning("OpenRouter patient summary failed: %s", exc.detail)
            except Exception as exc:  # noqa: BLE001
                logger.warning("OpenRouter patient summary error: %s", exc)

        return rules

    def _summarize_rules(
        self, payload: PatientSummaryRequest
    ) -> PatientSummaryResponse:
        sentences: list[str] = []
        highlights: list[str] = []
        attention: list[str] = []

        who = payload.patient_name or "Patient"
        conditions = (
            ", ".join(payload.chronic_conditions) or "no listed chronic conditions"
        )
        sentences.append(
            f"{who} is under continuity-of-care monitoring with {conditions}."
        )

        sugar_trend = self._trend(
            [v.blood_sugar for v in payload.vitals if v.blood_sugar is not None]
        )
        if sugar_trend == "up":
            sentences.append(
                "Blood sugar readings have increased across the recent check-in window."
            )
            highlights.append("Rising blood sugar trend")
            attention.append("Review recent glucose log at follow-up")
        elif sugar_trend == "down":
            sentences.append(
                "Blood sugar readings have eased compared with earlier values in this window."
            )
            highlights.append("Improving blood sugar trend")

        bp_vals = [
            v.bp_systolic for v in payload.vitals if v.bp_systolic is not None
        ]
        bp_trend = self._trend(bp_vals)
        if bp_trend == "up":
            sentences.append(
                "Systolic blood pressure shows an upward trend in recent vitals."
            )
            highlights.append("Rising BP trend")
            attention.append("Confirm home BP technique and adherence")

        adherence = self._adherence(payload)
        if adherence is not None:
            sentences.append(
                f"Reported medicine adherence is approximately {adherence:.0f}%."
            )
            highlights.append(f"Adherence ~{adherence:.0f}%")
            if adherence < 80:
                attention.append("Counsel on barriers to medicine adherence")

        missed_checkins = sum(
            1 for c in payload.checkins if c.medicine_taken is False
        )
        if missed_checkins:
            sentences.append(
                f"Medicine-taken flags were negative on {missed_checkins} recent check-in(s)."
            )

        if payload.recovery_score is not None:
            risk = payload.risk_level or "unspecified"
            sentences.append(
                f"Current Recovery Score is {payload.recovery_score:.0f}/100 "
                f"with readmission risk labeled {risk}."
            )
            highlights.append(f"Recovery Score {payload.recovery_score:.0f}")

        upcoming = [
            a
            for a in payload.appointments
            if (a.status or "").lower() in {"scheduled", "confirmed", ""}
        ]
        if upcoming:
            when = upcoming[0].scheduled_at or "the next clinic slot"
            sentences.append(f"Next scheduled encounter is around {when}.")
        else:
            sentences.append(
                "No upcoming appointment was provided in the request payload."
            )
            attention.append("Confirm follow-up appointment scheduling")

        clipped = sentences[:5]
        if len(clipped) < 3:
            clipped.append(
                "Continue monitoring vitals, adherence, and symptoms per the approved care plan."
            )
            clipped.append(
                "This summary is assistive only and does not diagnose or change prescriptions."
            )
            clipped = clipped[:5]

        return PatientSummaryResponse(
            summary=" ".join(clipped),
            highlights=highlights[:6],
            suggested_clinician_attention=attention[:6],
            sentence_count=len(clipped),
            meta=AiMeta(
                module=self.module_name,
                provider="trend_rules_v1",
                model_hint="deterministic_summary",
            ),
        )

    async def _summarize_with_llm(
        self,
        payload: PatientSummaryRequest,
        rules: PatientSummaryResponse,
    ) -> PatientSummaryResponse | None:
        context = {
            "patient_name": payload.patient_name,
            "age": payload.age,
            "sex": payload.sex,
            "chronic_conditions": payload.chronic_conditions,
            "recovery_score": payload.recovery_score,
            "risk_level": payload.risk_level,
            "vitals": [v.model_dump() for v in payload.vitals[:8]],
            "checkins": [c.model_dump() for c in payload.checkins[:6]],
            "medicines": [m.model_dump() for m in payload.medicines[:8]],
            "appointments": [a.model_dump() for a in payload.appointments[:4]],
            "health_timeline": (payload.extra_context or {}).get(
                "health_timeline"
            ),
            "daily_schedule": (payload.extra_context or {}).get(
                "daily_schedule"
            ),
            "care_plan_summary": (payload.extra_context or {}).get(
                "care_plan_summary"
            ),
            "rule_draft": rules.summary,
        }
        prompt = (
            "You are a clinical decision-support assistant for a doctor in India.\n"
            "Write a concise assistive routine summary (3–5 sentences) from the JSON.\n"
            "Ground the summary in recent health_timeline entries and daily_schedule "
            "items when present; if both are empty, say data is NA / insufficient.\n"
            "Cover recent vitals/check-ins, medicine adherence signals, and what to review.\n"
            "Do NOT diagnose, prescribe, or invent labs/hospitals.\n"
            "Return ONLY valid JSON with keys: summary (string), "
            "highlights (array of short strings), "
            "suggested_clinician_attention (array of short strings).\n\n"
            f"Patient data:\n{json.dumps(context)[:5000]}"
        )
        raw = await self._llm.complete(prompt, temperature=0.2, max_tokens=450)
        text = raw.strip()
        fenced = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
        if fenced:
            text = fenced.group(1).strip()
        data = json.loads(text)
        summary = str(data.get("summary") or "").strip()
        if not summary:
            return None
        highlights = [
            str(h).strip() for h in (data.get("highlights") or []) if str(h).strip()
        ] or rules.highlights
        attention = [
            str(h).strip()
            for h in (data.get("suggested_clinician_attention") or [])
            if str(h).strip()
        ] or rules.suggested_clinician_attention
        sentences = [s for s in re.split(r"(?<=[.!?])\s+", summary) if s.strip()]
        return PatientSummaryResponse(
            summary=summary,
            highlights=highlights[:6],
            suggested_clinician_attention=attention[:6],
            sentence_count=max(len(sentences), 1),
            meta=AiMeta(
                module=self.module_name,
                provider=f"openrouter:{self._llm.model}",
                model_hint=self._llm.model,
            ),
        )

    def _trend(self, values: list[float]) -> str | None:
        if len(values) < 2:
            return None
        first = sum(values[: max(1, len(values) // 2)]) / max(1, len(values) // 2)
        second = sum(values[len(values) // 2 :]) / max(
            1, len(values) - len(values) // 2
        )
        delta = second - first
        if delta > max(3.0, abs(first) * 0.05):
            return "up"
        if delta < -max(3.0, abs(first) * 0.05):
            return "down"
        return "flat"

    def _adherence(self, payload: PatientSummaryRequest) -> float | None:
        percents = [
            m.adherence_percent
            for m in payload.medicines
            if m.adherence_percent is not None
        ]
        if percents:
            return sum(percents) / len(percents)
        taken_flags = [
            c.medicine_taken for c in payload.checkins if c.medicine_taken is not None
        ]
        if not taken_flags:
            return None
        return 100.0 * (sum(1 for x in taken_flags if x) / len(taken_flags))

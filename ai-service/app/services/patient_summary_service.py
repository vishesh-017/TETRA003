"""AI Patient Summary — short assistive clinical narrative. Never diagnoses."""

from __future__ import annotations

from app.core.logging import get_logger
from app.schemas.common import AiMeta
from app.schemas.patient_summary import (
    PatientSummaryRequest,
    PatientSummaryResponse,
)

logger = get_logger(__name__)


class PatientSummaryService:
    module_name = "patient_summary"

    def summarize(self, payload: PatientSummaryRequest) -> PatientSummaryResponse:
        logger.info(
            "PatientSummary name=%r vitals=%s checkins=%s meds=%s",
            payload.patient_name,
            len(payload.vitals),
            len(payload.checkins),
            len(payload.medicines),
        )

        sentences: list[str] = []
        highlights: list[str] = []
        attention: list[str] = []

        who = payload.patient_name or "Patient"
        conditions = ", ".join(payload.chronic_conditions) or "no listed chronic conditions"
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

        # Keep 3–5 sentences
        clipped = sentences[:5]
        if len(clipped) < 3:
            clipped.append(
                "Continue monitoring vitals, adherence, and symptoms per the approved care plan."
            )
            clipped.append(
                "This summary is assistive only and does not diagnose or change prescriptions."
            )
            clipped = clipped[:5]

        summary = " ".join(clipped)
        return PatientSummaryResponse(
            summary=summary,
            highlights=highlights[:6],
            suggested_clinician_attention=attention[:6],
            sentence_count=len(clipped),
            meta=AiMeta(
                module=self.module_name,
                provider="trend_rules_v1",
                model_hint="deterministic_summary; ml_hook_ready",
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

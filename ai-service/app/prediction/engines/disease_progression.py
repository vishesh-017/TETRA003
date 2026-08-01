"""Disease Progression Service — condition worsening risk (non-prescriptive)."""

from __future__ import annotations

from app.core.logging import get_logger
from app.prediction.schemas.common import PredictionMeta
from app.prediction.schemas.progression import (
    Condition,
    ConditionProgression,
    DiseaseProgressionRequest,
    DiseaseProgressionResponse,
    ProgressRisk,
)
from app.prediction.utils import latest, series_values, trend_direction

logger = get_logger(__name__)

FOLLOW_UP = (
    "Share these trends with your clinician at the next visit. "
    "Do not change medicines without medical advice."
)


class DiseaseProgressionService:
    name = "disease_progression"

    def compute(
        self, payload: DiseaseProgressionRequest
    ) -> DiseaseProgressionResponse:
        focus = payload.focus_conditions or list(payload.conditions) or [
            "diabetes",
            "hypertension",
        ]
        # Normalize "other" away
        conditions: list[Condition] = [
            c  # type: ignore[misc]
            for c in focus
            if c in {"diabetes", "hypertension", "heart_disease", "ckd"}
        ]
        if not conditions:
            conditions = ["diabetes", "hypertension"]

        assessments = [self._assess(c, payload) for c in conditions]
        overall = self._worst([a.risk for a in assessments])
        summary = (
            f"Overall worsening risk is {overall}. "
            + " ".join(f"{a.condition}: {a.risk}." for a in assessments)
        )
        return DiseaseProgressionResponse(
            assessments=assessments,
            overall_worsening_risk=overall,
            summary=summary,
            meta=PredictionMeta(engine=self.name, impl="condition_rules_v1"),
        )

    def _assess(
        self, condition: Condition, payload: DiseaseProgressionRequest
    ) -> ConditionProgression:
        if condition == "diabetes":
            return self._diabetes(payload)
        if condition == "hypertension":
            return self._hypertension(payload)
        if condition == "heart_disease":
            return self._heart(payload)
        return self._ckd(payload)

    def _diabetes(self, payload: DiseaseProgressionRequest) -> ConditionProgression:
        sugar = series_values(payload.blood_sugar)
        direction = trend_direction(sugar)
        last = latest(payload.blood_sugar)
        adherence = payload.medicine_adherence_percent or 70
        risk: ProgressRisk = "low"
        confidence = 0.55
        reasons = []
        if direction == "increasing":
            risk = "moderate"
            confidence = 0.7
            reasons.append("glucose trend increasing")
        if last is not None and last >= 180:
            risk = "high"
            confidence = 0.8
            reasons.append(f"latest sugar {last:.0f}")
        if last is not None and last >= 250:
            risk = "critical"
            confidence = 0.85
            reasons.append("markedly elevated glucose")
        if adherence < 70:
            risk = self._escalate(risk)
            reasons.append("medicine adherence below 70%")
            confidence = min(0.9, confidence + 0.05)
        reason = (
            "; ".join(reasons)
            if reasons
            else "No strong diabetes worsening signals in provided data"
        )
        return ConditionProgression(
            condition="diabetes",
            risk=risk,
            reason=reason,
            confidence=confidence,
            recommendation=(
                "Request clinician review of recent glucose log and adherence. "
                + FOLLOW_UP
            ),
        )

    def _hypertension(
        self, payload: DiseaseProgressionRequest
    ) -> ConditionProgression:
        sys_vals = series_values(payload.blood_pressure_systolic)
        direction = trend_direction(sys_vals)
        last = latest(payload.blood_pressure_systolic)
        risk: ProgressRisk = "low"
        confidence = 0.55
        reasons = []
        if direction == "increasing":
            risk = "moderate"
            reasons.append("systolic BP trending up")
            confidence = 0.68
        if last is not None and last >= 150:
            risk = "high"
            reasons.append(f"latest systolic {last:.0f}")
            confidence = 0.78
        if last is not None and last >= 180:
            risk = "critical"
            reasons.append("severe hypertension range")
            confidence = 0.88
        reason = (
            "; ".join(reasons)
            if reasons
            else "BP pattern does not show clear worsening"
        )
        return ConditionProgression(
            condition="hypertension",
            risk=risk,
            reason=reason,
            confidence=confidence,
            recommendation=(
                "Bring home BP diary to follow-up; confirm measurement technique. "
                + FOLLOW_UP
            ),
        )

    def _heart(self, payload: DiseaseProgressionRequest) -> ConditionProgression:
        pain = payload.current_pain_score
        symptoms = payload.symptom_log[-1].symptoms if payload.symptom_log else []
        red_flags = {
            "chest pain",
            "chest discomfort",
            "shortness of breath",
            "breathlessness",
            "edema",
            "swelling",
        }
        hits = [s for s in symptoms if s.lower() in red_flags]
        risk: ProgressRisk = "low"
        confidence = 0.5
        reasons = []
        if hits:
            risk = "high"
            confidence = 0.75
            reasons.append("reported cardiac-suggestive symptoms: " + ", ".join(hits))
        if pain is not None and pain >= 7:
            risk = self._escalate(risk)
            reasons.append(f"high pain score {pain}")
            confidence = min(0.9, confidence + 0.1)
        if payload.missed_medicine_doses_7d >= 3:
            risk = self._escalate(risk)
            reasons.append("repeated missed medicines")
        reason = (
            "; ".join(reasons)
            if reasons
            else "No strong cardiac worsening flags in provided logs"
        )
        return ConditionProgression(
            condition="heart_disease",
            risk=risk,
            reason=reason,
            confidence=confidence,
            recommendation=(
                "Seek urgent clinical care for chest pain or severe breathlessness. "
                "Otherwise schedule prompt clinician review. " + FOLLOW_UP
            ),
        )

    def _ckd(self, payload: DiseaseProgressionRequest) -> ConditionProgression:
        # Without labs, use proxies: BP, weight gain, low adherence
        sys_v = latest(payload.blood_pressure_systolic)
        w_dir = trend_direction(series_values(payload.weight_kg), epsilon=0.3)
        risk: ProgressRisk = "low"
        confidence = 0.45
        reasons = []
        if sys_v is not None and sys_v >= 150:
            risk = "moderate"
            reasons.append("elevated BP can stress kidney recovery")
            confidence = 0.6
        if w_dir == "increasing":
            risk = self._escalate(risk)
            reasons.append("weight increasing (possible fluid retention signal)")
            confidence = min(0.75, confidence + 0.1)
        if payload.medicine_adherence_percent is not None and payload.medicine_adherence_percent < 70:
            risk = self._escalate(risk)
            reasons.append("suboptimal adherence")
        reason = (
            "; ".join(reasons)
            if reasons
            else "Limited CKD-specific labs; no strong proxy worsening signals"
        )
        return ConditionProgression(
            condition="ckd",
            risk=risk,
            reason=reason,
            confidence=confidence,
            recommendation=(
                "Discuss kidney follow-up labs and fluid guidance with your clinician. "
                + FOLLOW_UP
            ),
        )

    def _escalate(self, risk: ProgressRisk) -> ProgressRisk:
        order: list[ProgressRisk] = ["low", "moderate", "high", "critical"]
        idx = order.index(risk)
        return order[min(idx + 1, len(order) - 1)]

    def _worst(self, risks: list[ProgressRisk]) -> ProgressRisk:
        order = ["low", "moderate", "high", "critical"]
        return max(risks, key=lambda r: order.index(r))

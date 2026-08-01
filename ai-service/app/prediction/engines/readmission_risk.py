"""Readmission Risk Service — probability + explainable drivers."""

from __future__ import annotations

from app.core.logging import get_logger
from app.prediction.engines.recovery_score import RecoveryScoreService
from app.prediction.schemas.common import ContributingFactor, PredictionMeta
from app.prediction.schemas.readmission import (
    ReadmissionRiskRequest,
    ReadmissionRiskResponse,
    RiskCategory,
)
from app.prediction.schemas.recovery import RecoveryScoreRequest
from app.prediction.utils import (
    clamp,
    consecutive_rising,
    latest,
    series_values,
    trend_direction,
)

logger = get_logger(__name__)


class ReadmissionRiskService:
    name = "readmission_risk"

    def __init__(self) -> None:
        self._recovery = RecoveryScoreService()

    def compute(self, payload: ReadmissionRiskRequest) -> ReadmissionRiskResponse:
        logger.info("ReadmissionRisk patient=%s", payload.patient_id)

        recovery_score = payload.recovery_score
        if recovery_score is None:
            recovery_score = self._recovery.compute(
                RecoveryScoreRequest(**payload.model_dump())
            ).recovery_score

        base = clamp(100.0 - recovery_score * 0.85)
        explanations: list[str] = []
        factors: list[ContributingFactor] = []

        sugar_vals = series_values(payload.blood_sugar)
        sugar_streak = consecutive_rising(sugar_vals, min_days=3)
        if trend_direction(sugar_vals) == "increasing":
            base += 8
            explanations.append("Blood sugar shows an increasing trend")
            factors.append(
                ContributingFactor(
                    factor="blood_sugar_trend",
                    impact="negative",
                    weight=0.2,
                    detail="Rising glucose pattern",
                    evidence=f"Consecutive rises noted: {sugar_streak}",
                )
            )
        if sugar_streak >= 3:
            base += 6
            explanations.append(
                f"Sugar increased across {sugar_streak + 1} consecutive readings"
            )

        sys_v = latest(payload.blood_pressure_systolic)
        if sys_v is not None and sys_v >= 150:
            base += 10
            explanations.append("Blood pressure remains uncontrolled (systolic ≥ 150)")
            factors.append(
                ContributingFactor(
                    factor="blood_pressure",
                    impact="negative",
                    weight=0.18,
                    detail=f"Latest systolic {sys_v:.0f}",
                )
            )

        if payload.missed_medicine_doses_7d >= 2:
            base += min(14, payload.missed_medicine_doses_7d * 4)
            explanations.append(
                f"{payload.missed_medicine_doses_7d} medicine doses missed in 7 days"
            )
            factors.append(
                ContributingFactor(
                    factor="medicine_adherence",
                    impact="negative",
                    weight=0.22,
                    detail="Repeated missed medicines",
                )
            )

        if payload.symptom_log:
            last = payload.symptom_log[-1]
            if len(last.symptoms) >= 2 or (last.severity or 0) >= 6:
                base += 8
                explanations.append("Worsening or multi-symptom burden reported")
                factors.append(
                    ContributingFactor(
                        factor="symptoms",
                        impact="negative",
                        weight=0.15,
                        detail="Elevated symptom burden",
                    )
                )

        if payload.missed_appointments_30d >= 1:
            base += 7
            explanations.append("Missed follow-up appointment(s)")
            factors.append(
                ContributingFactor(
                    factor="appointments",
                    impact="negative",
                    weight=0.12,
                    detail=f"Missed appointments (30d): {payload.missed_appointments_30d}",
                )
            )

        if recovery_score < 60:
            base += 8
            explanations.append(
                f"Recovery Score decreased / low ({recovery_score:.0f}/100)"
            )
            factors.append(
                ContributingFactor(
                    factor="recovery_score",
                    impact="negative",
                    weight=0.2,
                    detail=f"Recovery Score {recovery_score:.0f}",
                )
            )

        probability = round(clamp(base), 1)
        category = self._category(probability)
        if not explanations:
            explanations.append(
                "No major deterioration flags; continue monitoring per care plan"
            )
            factors.append(
                ContributingFactor(
                    factor="baseline",
                    impact="neutral",
                    weight=0.1,
                    detail="Stable observation window",
                )
            )

        summary = (
            f"Estimated readmission probability is {probability:.0f}% ({category}). "
            f"Key driver: {explanations[0]}."
        )

        return ReadmissionRiskResponse(
            readmission_probability_percent=probability,
            risk_category=category,
            explanation=explanations,
            contributing_factors=factors,
            summary=summary,
            meta=PredictionMeta(engine=self.name, impl="risk_rules_v1"),
        )

    def _category(self, pct: float) -> RiskCategory:
        if pct >= 75:
            return "critical"
        if pct >= 55:
            return "high"
        if pct >= 35:
            return "medium"
        return "low"

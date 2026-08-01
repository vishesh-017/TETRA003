"""Lifestyle Simulator — before/after projection under habit changes."""

from __future__ import annotations

from copy import deepcopy

from app.core.logging import get_logger
from app.prediction.engines.disease_progression import DiseaseProgressionService
from app.prediction.engines.readmission_risk import ReadmissionRiskService
from app.prediction.engines.recovery_score import RecoveryScoreService
from app.prediction.schemas.common import PredictionMeta, TimedValue
from app.prediction.schemas.lifestyle import (
    LifestyleSimulationRequest,
    LifestyleSimulationResponse,
    ScenarioSnapshot,
)
from app.prediction.schemas.progression import DiseaseProgressionRequest
from app.prediction.schemas.readmission import ReadmissionRiskRequest
from app.prediction.schemas.recovery import RecoveryScoreRequest
from app.prediction.utils import clamp, latest

logger = get_logger(__name__)


class LifestyleSimulatorService:
    name = "lifestyle_simulator"

    def __init__(self) -> None:
        self._recovery = RecoveryScoreService()
        self._readmission = ReadmissionRiskService()
        self._progression = DiseaseProgressionService()

    def simulate(
        self, payload: LifestyleSimulationRequest
    ) -> LifestyleSimulationResponse:
        logger.info("LifestyleSimulator patient=%s", payload.baseline.patient_id)
        before = self._snapshot(payload.baseline)

        adjusted = deepcopy(payload.baseline)
        adj = payload.adjustments

        if adjusted.medicine_adherence_percent is None:
            adjusted.medicine_adherence_percent = 70.0
        adjusted.medicine_adherence_percent = clamp(
            adjusted.medicine_adherence_percent + adj.medicine_adherence_delta
        )

        self._bump_series(
            adjusted.exercise_minutes, adj.exercise_minutes_delta, default=15
        )
        self._bump_series(adjusted.sleep_hours, adj.sleep_hours_delta, default=6.5)
        self._bump_series(
            adjusted.water_intake_glasses, adj.water_intake_delta, default=5
        )
        self._bump_series(adjusted.weight_kg, adj.weight_kg_delta, default=70)

        after = self._snapshot(adjusted)
        deltas = {
            "recovery_score": round(after.recovery_score - before.recovery_score, 1),
            "readmission_probability_percent": round(
                after.readmission_probability_percent
                - before.readmission_probability_percent,
                1,
            ),
        }
        interpretation = self._interpret(deltas)
        chart_series = [
            {
                "metric": "Recovery Score",
                "before": before.recovery_score,
                "after": after.recovery_score,
            },
            {
                "metric": "Readmission %",
                "before": before.readmission_probability_percent,
                "after": after.readmission_probability_percent,
            },
        ]

        return LifestyleSimulationResponse(
            before=before,
            after=after,
            deltas=deltas,
            interpretation=interpretation,
            chart_series=chart_series,
            meta=PredictionMeta(engine=self.name, impl="counterfactual_rules_v1"),
        )

    def _snapshot(self, obs) -> ScenarioSnapshot:
        recovery = self._recovery.compute(RecoveryScoreRequest(**obs.model_dump()))
        readmit = self._readmission.compute(
            ReadmissionRiskRequest(
                **obs.model_dump(), recovery_score=recovery.recovery_score
            )
        )
        progress = self._progression.compute(
            DiseaseProgressionRequest(**obs.model_dump())
        )
        return ScenarioSnapshot(
            recovery_score=recovery.recovery_score,
            recovery_level=recovery.recovery_level,
            readmission_probability_percent=readmit.readmission_probability_percent,
            risk_category=readmit.risk_category,
            overall_worsening_risk=progress.overall_worsening_risk,
        )

    def _bump_series(
        self,
        series: list[TimedValue],
        delta: float,
        *,
        default: float,
    ) -> None:
        if abs(delta) < 1e-9:
            return
        if series:
            last = series[-1]
            series.append(
                TimedValue(
                    recorded_at=last.recorded_at,
                    value=max(0.0, last.value + delta),
                )
            )
        else:
            series.append(TimedValue(value=max(0.0, default + delta)))

    def _interpret(self, deltas: dict[str, float]) -> str:
        rec = deltas["recovery_score"]
        risk = deltas["readmission_probability_percent"]
        parts = []
        if rec > 0:
            parts.append(f"Recovery Score may improve by about {rec:.0f} points.")
        elif rec < 0:
            parts.append(f"Recovery Score may drop by about {abs(rec):.0f} points.")
        else:
            parts.append("Recovery Score stays roughly unchanged.")
        if risk < 0:
            parts.append(
                f"Readmission probability may fall by about {abs(risk):.0f}%."
            )
        elif risk > 0:
            parts.append(
                f"Readmission probability may rise by about {risk:.0f}%."
            )
        parts.append(
            "This is a simulation for education — not a medical prescription."
        )
        return " ".join(parts)

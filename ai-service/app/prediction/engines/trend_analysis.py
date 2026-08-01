"""Trend Analysis Engine — time-series directions + NL summaries."""

from __future__ import annotations

from app.core.logging import get_logger
from app.prediction.schemas.common import PredictionMeta
from app.prediction.schemas.trends import (
    TrendAnalysisRequest,
    TrendAnalysisResponse,
    TrendItem,
)
from app.prediction.utils import series_values, trend_direction

logger = get_logger(__name__)


class TrendAnalysisService:
    name = "trend_analysis"

    def compute(self, payload: TrendAnalysisRequest) -> TrendAnalysisResponse:
        logger.info("TrendAnalysis patient=%s", payload.patient_id)
        trends: list[TrendItem] = []

        trends.append(
            self._metric(
                "blood_sugar",
                "Blood Sugar",
                payload.blood_sugar,
                rising_bad=True,
            )
        )
        trends.append(
            self._metric(
                "blood_pressure_systolic",
                "Blood Pressure",
                payload.blood_pressure_systolic,
                rising_bad=True,
            )
        )
        trends.append(
            self._adherence_trend(payload.medicine_adherence_percent)
        )
        trends.append(self._symptom_trend(payload))
        trends.append(
            self._metric(
                "weight_kg",
                "Weight",
                payload.weight_kg,
                rising_bad=None,
            )
        )
        trends.append(
            self._metric(
                "sleep_hours",
                "Sleep",
                payload.sleep_hours,
                rising_bad=False,
            )
        )

        narrative = self._narrative(trends)
        return TrendAnalysisResponse(
            trends=trends,
            narrative_summary=narrative,
            meta=PredictionMeta(engine=self.name, impl="series_rules_v1"),
        )

    def _metric(
        self,
        key: str,
        label: str,
        series: list,
        *,
        rising_bad: bool | None,
    ) -> TrendItem:
        values = series_values(series)
        direction = trend_direction(values)
        if direction == "increasing":
            tone = (
                "worsening"
                if rising_bad is True
                else "improving"
                if rising_bad is False
                else "changing"
            )
            nl = f"{label} is increasing over the observed window ({tone} signal)."
        elif direction == "decreasing":
            tone = (
                "improving"
                if rising_bad is True
                else "worsening"
                if rising_bad is False
                else "changing"
            )
            nl = f"{label} is decreasing over the observed window ({tone} signal)."
        elif direction == "stable":
            nl = f"{label} appears stable across recent readings."
        else:
            nl = f"Not enough {label.lower()} points to detect a reliable trend."

        points = [
            {
                "index": float(i + 1),
                "value": float(p.value),
                "recorded_at": p.recorded_at.isoformat() if p.recorded_at else None,
            }
            for i, p in enumerate(series[-14:])
        ]
        pretty = {
            "increasing": f"{label} Increasing",
            "decreasing": f"{label} Decreasing",
            "stable": f"{label} Stable",
            "insufficient": f"{label} — Insufficient Data",
        }[direction]
        return TrendItem(
            metric=key,
            direction=direction,  # type: ignore[arg-type]
            label=pretty,
            natural_language=nl,
            points=points,
        )

    def _adherence_trend(self, adherence: float | None) -> TrendItem:
        if adherence is None:
            return TrendItem(
                metric="medicine_adherence",
                direction="insufficient",
                label="Medicine Adherence — Insufficient Data",
                natural_language="Medicine adherence percentage was not provided.",
            )
        if adherence >= 85:
            direction = "stable"
            label = "Medicine Adherence Improving"
            nl = f"Medicine adherence is strong at about {adherence:.0f}%."
        elif adherence >= 70:
            direction = "stable"
            label = "Medicine Adherence Stable"
            nl = f"Medicine adherence is moderate at about {adherence:.0f}%."
        else:
            direction = "decreasing"
            label = "Medicine Adherence Worsening"
            nl = f"Medicine adherence is low at about {adherence:.0f}%."
        return TrendItem(
            metric="medicine_adherence",
            direction=direction,  # type: ignore[arg-type]
            label=label,
            natural_language=nl,
            points=[{"index": 1.0, "value": float(adherence), "recorded_at": None}],
        )

    def _symptom_trend(self, payload: TrendAnalysisRequest) -> TrendItem:
        if len(payload.symptom_log) < 2:
            return TrendItem(
                metric="symptoms",
                direction="insufficient",
                label="Symptoms — Insufficient Data",
                natural_language="Need more symptom check-ins to judge symptom trend.",
            )
        scores = []
        for s in payload.symptom_log:
            sev = s.severity if s.severity is not None else len(s.symptoms) * 2
            pain = s.pain_score or 0
            scores.append(float(sev) + float(pain))
        direction = trend_direction(scores)
        if direction == "increasing":
            label = "Symptoms Worsening"
            nl = "Symptom burden is increasing across recent check-ins."
        elif direction == "decreasing":
            label = "Symptoms Improving"
            nl = "Symptom burden is decreasing across recent check-ins."
        else:
            label = "Symptoms Stable"
            nl = "Symptom burden appears relatively stable."
        return TrendItem(
            metric="symptoms",
            direction=direction,  # type: ignore[arg-type]
            label=label,
            natural_language=nl,
            points=[
                {"index": float(i + 1), "value": v, "recorded_at": None}
                for i, v in enumerate(scores[-14:])
            ],
        )

    def _narrative(self, trends: list[TrendItem]) -> str:
        bits = [t.natural_language for t in trends if t.direction != "insufficient"]
        if not bits:
            return "Insufficient longitudinal data for a trend narrative."
        return " ".join(bits[:4])

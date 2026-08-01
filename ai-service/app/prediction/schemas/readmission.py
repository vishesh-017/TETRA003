from typing import Literal

from pydantic import BaseModel, Field

from app.prediction.schemas.common import (
    ContributingFactor,
    PatientObservationBundle,
    PredictionMeta,
)

RiskCategory = Literal["low", "medium", "high", "critical"]


class ReadmissionRiskRequest(PatientObservationBundle):
    recovery_score: float | None = Field(default=None, ge=0, le=100)


class ReadmissionRiskResponse(BaseModel):
    readmission_probability_percent: float = Field(ge=0, le=100)
    risk_category: RiskCategory
    explanation: list[str]
    contributing_factors: list[ContributingFactor]
    summary: str
    meta: PredictionMeta

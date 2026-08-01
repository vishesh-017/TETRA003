from typing import Literal

from pydantic import BaseModel, Field

from app.prediction.schemas.common import (
    ContributingFactor,
    PatientObservationBundle,
    PredictionMeta,
)

RecoveryLevel = Literal[
    "excellent",
    "good",
    "moderate",
    "needs_attention",
    "critical",
]


class RecoveryScoreRequest(PatientObservationBundle):
    pass


class RecoveryScoreResponse(BaseModel):
    recovery_score: float = Field(ge=0, le=100)
    recovery_level: RecoveryLevel
    contributing_factors: list[ContributingFactor]
    factor_scores: dict[str, float]
    summary: str
    meta: PredictionMeta

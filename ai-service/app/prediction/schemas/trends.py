from typing import Literal

from pydantic import BaseModel, Field

from app.prediction.schemas.common import PatientObservationBundle, PredictionMeta

TrendDirection = Literal["increasing", "decreasing", "stable", "insufficient"]


class TrendItem(BaseModel):
    metric: str
    direction: TrendDirection
    label: str
    natural_language: str
    points: list[dict[str, float | str | None]] = Field(default_factory=list)


class TrendAnalysisRequest(PatientObservationBundle):
    pass


class TrendAnalysisResponse(BaseModel):
    trends: list[TrendItem]
    narrative_summary: str
    meta: PredictionMeta

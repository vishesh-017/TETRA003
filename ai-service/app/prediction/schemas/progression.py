from typing import Literal

from pydantic import BaseModel, Field

from app.prediction.schemas.common import PatientObservationBundle, PredictionMeta

Condition = Literal["diabetes", "hypertension", "heart_disease", "ckd"]
ProgressRisk = Literal["low", "moderate", "high", "critical"]


class DiseaseProgressionRequest(PatientObservationBundle):
    focus_conditions: list[Condition] | None = None


class ConditionProgression(BaseModel):
    condition: Condition
    risk: ProgressRisk
    reason: str
    confidence: float = Field(ge=0, le=1)
    recommendation: str = Field(
        description="Non-prescriptive follow-up guidance only."
    )


class DiseaseProgressionResponse(BaseModel):
    assessments: list[ConditionProgression]
    overall_worsening_risk: ProgressRisk
    summary: str
    meta: PredictionMeta

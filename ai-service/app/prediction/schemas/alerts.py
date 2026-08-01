from typing import Literal

from pydantic import BaseModel, Field

from app.prediction.schemas.common import PatientObservationBundle, PredictionMeta

AlertAction = Literal[
    "no_action",
    "monitor",
    "doctor_review",
    "immediate_attention",
    "emergency",
]


class AlertDecisionRequest(PatientObservationBundle):
    recovery_score: float | None = Field(default=None, ge=0, le=100)
    readmission_probability_percent: float | None = Field(default=None, ge=0, le=100)


class AlertDecisionResponse(BaseModel):
    action: AlertAction
    urgency: int = Field(ge=1, le=5)
    title: str
    rationale: list[str]
    clinician_message: str
    patient_message: str
    meta: PredictionMeta

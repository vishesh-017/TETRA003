from pydantic import BaseModel, Field

from app.prediction.schemas.common import PatientObservationBundle, PredictionMeta
from app.prediction.schemas.progression import ProgressRisk
from app.prediction.schemas.readmission import RiskCategory
from app.prediction.schemas.recovery import RecoveryLevel


class LifestyleAdjustments(BaseModel):
    exercise_minutes_delta: float = 0
    sleep_hours_delta: float = 0
    water_intake_delta: float = 0
    medicine_adherence_delta: float = 0
    weight_kg_delta: float = 0


class LifestyleSimulationRequest(BaseModel):
    baseline: PatientObservationBundle
    adjustments: LifestyleAdjustments


class ScenarioSnapshot(BaseModel):
    recovery_score: float
    recovery_level: RecoveryLevel
    readmission_probability_percent: float
    risk_category: RiskCategory
    overall_worsening_risk: ProgressRisk


class LifestyleSimulationResponse(BaseModel):
    before: ScenarioSnapshot
    after: ScenarioSnapshot
    deltas: dict[str, float]
    interpretation: str
    chart_series: list[dict[str, float | str]]
    meta: PredictionMeta

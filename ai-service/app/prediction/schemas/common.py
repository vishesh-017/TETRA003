from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.core.constants import CLINICAL_DISCLAIMER


class TimedValue(BaseModel):
    recorded_at: datetime | None = None
    value: float


class SymptomPoint(BaseModel):
    recorded_at: datetime | None = None
    symptoms: list[str] = Field(default_factory=list)
    pain_score: float | None = Field(default=None, ge=0, le=10)
    severity: float | None = Field(default=None, ge=0, le=10)


class PatientObservationBundle(BaseModel):
    """Shared clinical observation payload for all prediction modules."""

    patient_id: str | None = None
    patient_name: str | None = None
    age: int | None = Field(default=None, ge=0, le=120)
    sex: str | None = None
    conditions: list[
        Literal["diabetes", "hypertension", "heart_disease", "ckd", "other"]
    ] = Field(default_factory=list)

    medicine_adherence_percent: float | None = Field(default=None, ge=0, le=100)
    missed_medicine_doses_7d: int = Field(default=0, ge=0)
    appointment_adherence_percent: float | None = Field(default=None, ge=0, le=100)
    missed_appointments_30d: int = Field(default=0, ge=0)
    checkin_completion_percent: float | None = Field(default=None, ge=0, le=100)

    blood_pressure_systolic: list[TimedValue] = Field(default_factory=list)
    blood_pressure_diastolic: list[TimedValue] = Field(default_factory=list)
    blood_sugar: list[TimedValue] = Field(default_factory=list)
    sleep_hours: list[TimedValue] = Field(default_factory=list)
    water_intake_glasses: list[TimedValue] = Field(default_factory=list)
    exercise_minutes: list[TimedValue] = Field(default_factory=list)
    temperature_f: list[TimedValue] = Field(default_factory=list)
    weight_kg: list[TimedValue] = Field(default_factory=list)
    symptom_log: list[SymptomPoint] = Field(default_factory=list)

    current_pain_score: float | None = Field(default=None, ge=0, le=10)
    notes: str | None = None


class ContributingFactor(BaseModel):
    factor: str
    impact: Literal["positive", "negative", "neutral"]
    weight: float = Field(ge=0, le=1)
    detail: str
    evidence: str | None = None


class PredictionMeta(BaseModel):
    engine: str
    impl: str = "rule_based_v1"
    ml_ready: bool = True
    assistive: Literal[True] = True
    disclaimer: str = CLINICAL_DISCLAIMER
    generated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    extensibility: dict[str, Any] = Field(
        default_factory=lambda: {
            "swap_to_xgboost_without_api_change": True,
            "swap_to_random_forest_without_api_change": True,
        }
    )

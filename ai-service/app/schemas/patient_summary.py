from typing import Any

from pydantic import BaseModel, Field

from app.schemas.common import AiMeta


class VitalPoint(BaseModel):
    date: str | None = None
    bp_systolic: float | None = None
    bp_diastolic: float | None = None
    blood_sugar: float | None = None
    temperature: float | None = None
    oxygen: float | None = None
    weight: float | None = None
    pain_score: float | None = None


class CheckInBrief(BaseModel):
    recorded_at: str | None = None
    symptoms: list[str] = Field(default_factory=list)
    notes: str | None = None
    medicine_taken: bool | None = None


class MedicineBrief(BaseModel):
    name: str
    adherence_percent: float | None = None
    missed_doses: int | None = None


class AppointmentBrief(BaseModel):
    scheduled_at: str | None = None
    status: str | None = None
    appointment_type: str | None = None


class PatientSummaryRequest(BaseModel):
    patient_name: str | None = None
    age: int | None = None
    sex: str | None = None
    chronic_conditions: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    recovery_score: float | None = None
    risk_level: str | None = None
    vitals: list[VitalPoint] = Field(default_factory=list)
    checkins: list[CheckInBrief] = Field(default_factory=list)
    medicines: list[MedicineBrief] = Field(default_factory=list)
    appointments: list[AppointmentBrief] = Field(default_factory=list)
    extra_context: dict[str, Any] = Field(default_factory=dict)


class PatientSummaryResponse(BaseModel):
    summary: str = Field(description="3–5 clinical sentences, assistive only")
    highlights: list[str] = Field(default_factory=list)
    suggested_clinician_attention: list[str] = Field(default_factory=list)
    sentence_count: int
    meta: AiMeta

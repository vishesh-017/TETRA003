"""Clinical entity schemas (scaffold — no business logic)."""

from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.enums import AppointmentStatus, CarePlanStatus, DischargeSource
from app.schemas.common import ORMModel


class DischargeSummaryCreate(BaseModel):
    patient_id: UUID
    source: DischargeSource
    raw_text: Optional[str] = None
    diagnosis_text: Optional[str] = None
    procedure_text: Optional[str] = None
    discharge_date: Optional[date] = None
    hospital_name: Optional[str] = None


class DischargeSummaryRead(ORMModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    source: DischargeSource
    diagnosis_text: Optional[str] = None
    procedure_text: Optional[str] = None
    discharge_date: Optional[date] = None
    hospital_name: Optional[str] = None
    status: str


class MedicineRead(ORMModel):
    id: UUID
    care_plan_id: UUID
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None
    route: Optional[str] = None
    schedule: Optional[dict[str, Any]] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    instructions: Optional[str] = None


class AppointmentCreate(BaseModel):
    patient_id: UUID
    scheduled_at: datetime
    location: Optional[str] = None
    notes: Optional[str] = None


class AppointmentRead(ORMModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    scheduled_at: datetime
    location: Optional[str] = None
    status: AppointmentStatus
    notes: Optional[str] = None


class CarePlanRead(ORMModel):
    id: UUID
    patient_id: UUID
    doctor_id: UUID
    discharge_id: Optional[UUID] = None
    status: CarePlanStatus
    approved_at: Optional[datetime] = None


class DailyCheckInCreate(BaseModel):
    patient_id: UUID
    pain_score: Optional[int] = Field(default=None, ge=0, le=10)
    symptoms: Optional[dict[str, Any]] = None
    vitals: Optional[dict[str, Any]] = None
    notes: Optional[str] = None
    client_mutation_id: Optional[str] = None


class DailyCheckInRead(ORMModel):
    id: UUID
    patient_id: UUID
    recorded_at: datetime
    pain_score: Optional[int] = None
    symptoms: Optional[dict[str, Any]] = None
    vitals: Optional[dict[str, Any]] = None
    notes: Optional[str] = None

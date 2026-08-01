"""User and profile schemas."""

from datetime import date
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import UserRole, WorkerType
from app.schemas.common import ORMModel


class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    full_name: str = Field(min_length=1, max_length=255)
    phone: Optional[str] = None
    locale: str = "en"


class UserCreate(UserBase):
    role: UserRole


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    locale: Optional[str] = None
    avatar_url: Optional[str] = None


class UserRead(ORMModel):
    id: UUID
    email: Optional[EmailStr] = None
    full_name: str
    phone: Optional[str] = None
    role: UserRole
    locale: str
    avatar_url: Optional[str] = None
    is_active: bool


class DoctorProfileRead(ORMModel):
    id: UUID
    user_id: UUID
    registration_no: Optional[str] = None
    specialty: Optional[str] = None
    hospital_affiliation: Optional[str] = None
    verified: bool


class PatientProfileRead(ORMModel):
    id: UUID
    user_id: UUID
    date_of_birth: Optional[date] = None
    sex: Optional[str] = None
    blood_group: Optional[str] = None
    abha_id_demo: Optional[str] = None
    address: Optional[dict[str, Any]] = None


class CaregiverProfileRead(ORMModel):
    id: UUID
    user_id: UUID
    relationship_type: Optional[str] = None


class HealthWorkerProfileRead(ORMModel):
    id: UUID
    user_id: UUID
    worker_type: WorkerType
    phc_code: Optional[str] = None
    district: Optional[str] = None
    languages: Optional[list[str]] = None


class MeResponse(BaseModel):
    user: UserRead
    doctor: Optional[DoctorProfileRead] = None
    patient: Optional[PatientProfileRead] = None
    caregiver: Optional[CaregiverProfileRead] = None
    health_worker: Optional[HealthWorkerProfileRead] = None

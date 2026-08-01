"""User profile and role-specific profile models."""

import uuid
from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import UserRole, WorkerType


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    """Application user profile (id aligns with Supabase auth.users.id)."""

    __tablename__ = "users"

    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(32), index=True)
    role: Mapped[UserRole] = mapped_column(String(32), nullable=False, index=True)
    locale: Mapped[str] = mapped_column(String(16), default="en", nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(512))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    doctor_profile: Mapped[Optional["Doctor"]] = relationship(back_populates="user", uselist=False)
    patient_profile: Mapped[Optional["Patient"]] = relationship(back_populates="user", uselist=False)
    caregiver_profile: Mapped[Optional["Caregiver"]] = relationship(
        back_populates="user", uselist=False
    )
    health_worker_profile: Mapped[Optional["HealthWorker"]] = relationship(
        back_populates="user", uselist=False
    )


class Doctor(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "doctors"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    registration_no: Mapped[Optional[str]] = mapped_column(String(64))
    specialty: Mapped[Optional[str]] = mapped_column(String(128))
    hospital_affiliation: Mapped[Optional[str]] = mapped_column(String(255))
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped[User] = relationship(back_populates="doctor_profile")


class Patient(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "patients"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    date_of_birth: Mapped[Optional[date]] = mapped_column(Date)
    sex: Mapped[Optional[str]] = mapped_column(String(32))
    blood_group: Mapped[Optional[str]] = mapped_column(String(8))
    abha_id_demo: Mapped[Optional[str]] = mapped_column(String(64), index=True)
    address: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)

    user: Mapped[User] = relationship(back_populates="patient_profile")
    passport: Mapped[Optional["PatientPassport"]] = relationship(
        "PatientPassport",
        back_populates="patient",
        uselist=False,
    )


class Caregiver(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "caregivers"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    relationship_type: Mapped[Optional[str]] = mapped_column(String(64))

    user: Mapped[User] = relationship(back_populates="caregiver_profile")


class HealthWorker(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "health_workers"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True
    )
    worker_type: Mapped[WorkerType] = mapped_column(String(16), nullable=False)
    phc_code: Mapped[Optional[str]] = mapped_column(String(64))
    district: Mapped[Optional[str]] = mapped_column(String(128))
    languages: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String))

    user: Mapped[User] = relationship(back_populates="health_worker_profile")

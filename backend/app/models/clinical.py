"""Clinical continuity models: discharge, care plans, medicines, appointments."""

import uuid
from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import (
    AppointmentStatus,
    CarePlanStatus,
    CareRelationshipStatus,
    DischargeSource,
)


class CareRelationship(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "care_relationships"

    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), index=True
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[CareRelationshipStatus] = mapped_column(
        String(32), default=CareRelationshipStatus.ACTIVE, nullable=False
    )
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class CaregiverAssignment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "caregiver_assignments"

    caregiver_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("caregivers.id", ondelete="CASCADE"), index=True
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)


class DischargeSummary(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "discharge_summaries"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), index=True
    )
    source: Mapped[DischargeSource] = mapped_column(String(32), nullable=False)
    raw_text: Mapped[Optional[str]] = mapped_column(Text)
    file_url: Mapped[Optional[str]] = mapped_column(String(512))
    diagnosis_text: Mapped[Optional[str]] = mapped_column(Text)
    procedure_text: Mapped[Optional[str]] = mapped_column(Text)
    discharge_date: Mapped[Optional[date]] = mapped_column(Date)
    hospital_name: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(32), default="draft", nullable=False)


class CarePlan(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "care_plans"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), index=True
    )
    discharge_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("discharge_summaries.id", ondelete="SET NULL")
    )
    status: Mapped[CarePlanStatus] = mapped_column(
        String(32), default=CarePlanStatus.AI_DRAFT, nullable=False
    )
    ai_model_meta: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))


class Medicine(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "medicines"

    care_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("care_plans.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    dose: Mapped[Optional[str]] = mapped_column(String(128))
    frequency: Mapped[Optional[str]] = mapped_column(String(128))
    route: Mapped[Optional[str]] = mapped_column(String(64))
    schedule: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    instructions: Mapped[Optional[str]] = mapped_column(Text)


class DailyTask(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "daily_tasks"

    care_plan_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("care_plans.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    cadence: Mapped[str] = mapped_column(String(64), default="daily", nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Appointment(Base, UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin):
    __tablename__ = "appointments"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )
    doctor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("doctors.id", ondelete="CASCADE"), index=True
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[AppointmentStatus] = mapped_column(
        String(32), default=AppointmentStatus.SCHEDULED, nullable=False
    )
    notes: Mapped[Optional[str]] = mapped_column(Text)
    reminder_offsets: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)

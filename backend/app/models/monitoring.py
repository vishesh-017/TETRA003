"""Monitoring, risk, alerts, and notification models."""

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import (
    AlertStatus,
    MedicineEventStatus,
    NotificationChannel,
    RiskLevel,
)


class DailyCheckIn(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "daily_checkins"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )
    recorded_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL")
    )
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    symptoms: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)
    vitals: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)
    pain_score: Mapped[Optional[int]] = mapped_column(Integer)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    client_mutation_id: Mapped[Optional[str]] = mapped_column(String(128), unique=True)


class MedicineEvent(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "medicine_events"

    medicine_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("medicines.id", ondelete="CASCADE"), index=True
    )
    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[MedicineEventStatus] = mapped_column(String(32), nullable=False)
    scheduled_for: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    acted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    client_mutation_id: Mapped[Optional[str]] = mapped_column(String(128), unique=True)


class RiskPrediction(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "risk_predictions"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )
    score: Mapped[float] = mapped_column(Float, nullable=False)
    level: Mapped[RiskLevel] = mapped_column(String(32), nullable=False, index=True)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    features: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)
    explanation: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Alert(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "alerts"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )
    alert_type: Mapped[str] = mapped_column(String(64), nullable=False)
    severity: Mapped[RiskLevel] = mapped_column(String(32), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[AlertStatus] = mapped_column(
        String(32), default=AlertStatus.OPEN, nullable=False, index=True
    )
    triggered_by: Mapped[Optional[str]] = mapped_column(String(128))
    notified_roles: Mapped[Optional[list[str]]] = mapped_column(ARRAY(String))


class Notification(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "notifications"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    channel: Mapped[NotificationChannel] = mapped_column(
        String(32), default=NotificationChannel.IN_APP, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    body: Mapped[Optional[str]] = mapped_column(Text)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    meta: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)


class HealthReport(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "health_reports"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )
    week_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    metrics: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)
    ai_narrative: Mapped[Optional[str]] = mapped_column(Text)
    pdf_url: Mapped[Optional[str]] = mapped_column(String(512))

"""PM-JAY guidance and ABDM-compatible demo import models."""

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import HospitalType


class PmjayGuidance(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "pmjay_guidance"

    topic: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    locale: Mapped[str] = mapped_column(String(16), default="en", nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content_md: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(64))


class Hospital(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "hospitals"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hospital_type: Mapped[HospitalType] = mapped_column(String(32), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[Optional[str]] = mapped_column(String(512))
    city: Mapped[str] = mapped_column(String(128), default="Ahmedabad", nullable=False)
    pmjay_empanelled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(32))


class AbdmImport(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Demo ABHA / ABDM import payload storage."""

    __tablename__ = "abdm_imports"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), index=True
    )
    abha_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    source: Mapped[str] = mapped_column(String(32), default="demo", nullable=False)

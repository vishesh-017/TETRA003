"""Digital Patient Passport model."""

import uuid
from typing import Any, Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class PatientPassport(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "patient_passports"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="CASCADE"), unique=True
    )
    qr_token: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    emergency_contacts: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)
    allergies: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)
    medical_history: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)
    current_medicines_snapshot: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB)

    patient: Mapped["Patient"] = relationship("Patient", back_populates="passport")

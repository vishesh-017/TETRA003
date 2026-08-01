"""Rural health worker offline screening and sync models."""

import uuid
from datetime import datetime
from typing import Any, Optional

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import SyncState


class HealthWorkerRecord(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    """Offline screening session captured by ASHA / ANM workers."""

    __tablename__ = "health_worker_records"

    worker_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("health_workers.id", ondelete="CASCADE"), index=True
    )
    patient_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("patients.id", ondelete="SET NULL"), index=True
    )
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sync_state: Mapped[SyncState] = mapped_column(
        String(32), default=SyncState.PENDING, nullable=False, index=True
    )


class SyncMutation(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "sync_mutations"

    client_mutation_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    actor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    entity_type: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(JSONB, nullable=False)
    applied_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    conflict_state: Mapped[Optional[str]] = mapped_column(String(32))

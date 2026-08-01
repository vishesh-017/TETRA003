"""Health and readiness endpoints."""

from fastapi import APIRouter
from sqlalchemy import text

from app import __version__
from app.api.deps import DbSession
from app.core.config import get_settings
from app.schemas.common import HealthResponse, ReadyResponse

router = APIRouter(tags=["system"])


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    settings = get_settings()
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        environment=settings.app_env,
        version=__version__,
    )


@router.get("/ready", response_model=ReadyResponse)
def readiness_check(db: DbSession) -> ReadyResponse:
    try:
        db.execute(text("SELECT 1"))
        return ReadyResponse(status="ready", database="up")
    except Exception as exc:  # noqa: BLE001 — surface readiness failure cleanly
        return ReadyResponse(
            status="degraded",
            database="down",
            detail=str(exc),
        )

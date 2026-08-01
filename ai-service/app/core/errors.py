from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.logging import get_logger

logger = get_logger(__name__)


class AiServiceError(Exception):
    """Base application error for AI modules."""

    def __init__(
        self,
        detail: str,
        *,
        code: str = "AI_SERVICE_ERROR",
        status_code: int = 500,
        meta: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(detail)
        self.detail = detail
        self.code = code
        self.status_code = status_code
        self.meta = meta or {}


class ProviderUnavailableError(AiServiceError):
    def __init__(self, provider: str, detail: str | None = None) -> None:
        super().__init__(
            detail
            or f"{provider} is temporarily unavailable. Falling back when possible.",
            code="PROVIDER_UNAVAILABLE",
            status_code=503,
            meta={"provider": provider},
        )


class SafetyViolationError(AiServiceError):
    def __init__(self, detail: str) -> None:
        super().__init__(
            detail,
            code="SAFETY_VIOLATION",
            status_code=400,
        )


def error_payload(
    *,
    status: int,
    detail: str,
    code: str,
    meta: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "type": "about:blank",
        "title": "AI Service Error",
        "status": status,
        "detail": detail,
        "code": code,
        "meta": meta or {},
        "assistive": True,
    }


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AiServiceError)
    async def ai_service_error_handler(
        _request: Request,
        exc: AiServiceError,
    ) -> JSONResponse:
        logger.warning("AiServiceError %s: %s", exc.code, exc.detail)
        return JSONResponse(
            status_code=exc.status_code,
            content=error_payload(
                status=exc.status_code,
                detail=exc.detail,
                code=exc.code,
                meta=exc.meta,
            ),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        _request: Request,
        exc: RequestValidationError,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=422,
            content=error_payload(
                status=422,
                detail="Request validation failed. Check required fields and types.",
                code="VALIDATION_ERROR",
                meta={"errors": exc.errors()},
            ),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_error_handler(
        _request: Request,
        exc: StarletteHTTPException,
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=error_payload(
                status=exc.status_code,
                detail=str(exc.detail),
                code="HTTP_ERROR",
            ),
        )

    @app.exception_handler(Exception)
    async def unhandled_error_handler(
        _request: Request,
        exc: Exception,
    ) -> JSONResponse:
        logger.exception("Unhandled AI service error: %s", exc)
        return JSONResponse(
            status_code=500,
            content=error_payload(
                status=500,
                detail="Unexpected AI service failure. Please try again.",
                code="INTERNAL_ERROR",
            ),
        )

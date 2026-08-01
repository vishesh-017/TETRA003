"""Domain and HTTP exception helpers."""

from typing import Any, Optional

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


class HealNexusError(Exception):
    """Base application error."""

    def __init__(
        self,
        message: str,
        *,
        code: str = "HEALNEXUS_ERROR",
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


async def healnexus_exception_handler(
    _request: Request, exc: HealNexusError
) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": "about:blank",
            "title": exc.code,
            "status": exc.status_code,
            "detail": exc.message,
            "code": exc.code,
            "details": exc.details,
        },
    )


async def http_exception_handler(_request: Request, exc: HTTPException) -> JSONResponse:
    detail = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": "about:blank",
            "title": "HTTP Error",
            "status": exc.status_code,
            "detail": detail,
            "code": "HTTP_ERROR",
        },
        headers=getattr(exc, "headers", None),
    )

"""HealNexus FastAPI application entrypoint."""

from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import (
    HealNexusError,
    healnexus_exception_handler,
    http_exception_handler,
)
from app.core.logging import configure_logging, get_logger
from app.middleware.request_logging import RequestLoggingMiddleware

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    logger.info(
        "Starting %s v%s (%s)",
        settings.app_name,
        __version__,
        settings.app_env,
    )
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_app() -> FastAPI:
    settings = get_settings()

    application = FastAPI(
        title=settings.app_name,
        description=(
            "AI-powered Continuity of Care platform. "
            "AI assists doctors — it never diagnoses, prescribes, or replaces clinicians."
        ),
        version=__version__,
        lifespan=lifespan,
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.add_middleware(RequestLoggingMiddleware)

    application.add_exception_handler(HealNexusError, healnexus_exception_handler)
    application.add_exception_handler(HTTPException, http_exception_handler)

    application.include_router(api_router, prefix=settings.api_v1_prefix)

    @application.get("/", include_in_schema=False)
    def root() -> dict[str, str]:
        return {
            "service": settings.app_name,
            "version": __version__,
            "docs": "/docs",
            "health": f"{settings.api_v1_prefix}/health",
        }

    return application


app = create_app()

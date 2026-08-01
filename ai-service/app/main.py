from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.constants import CLINICAL_DISCLAIMER
from app.core.errors import register_exception_handlers
from app.core.logging import get_logger, setup_logging
from app.schemas.common import HealthResponse

setup_logging()
logger = get_logger(__name__)
settings = get_settings()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info(
        "Starting %s env=%s exa=%s",
        settings.app_name,
        settings.app_env,
        settings.exa_configured,
    )
    yield
    logger.info("Shutting down HealNexus AI Service")


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description=(
        "HealNexus AI Intelligence Platform — assistive Care Companion services. "
        + CLINICAL_DISCLAIMER
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

register_exception_handlers(app)
app.include_router(api_router)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="healnexus-ai-service",
        environment=settings.app_env,
        exa_configured=settings.exa_configured,
        supabase_configured=settings.supabase_configured,
        ml_hook_configured=bool(settings.ml_inference_url),
        modules=[
            "care-companion",
            "patient-summary",
            "health-assistant",
            "education",
            "government-guidance",
            "predict/recovery-score",
            "predict/readmission",
            "predict/disease-progression",
            "predict/trends",
            "predict/lifestyle-simulation",
            "predict/alerts",
            "predict/explain",
        ],
    )


@app.get("/")
def root() -> dict[str, str]:
    return {
        "service": settings.app_name,
        "docs": "/docs",
        "health": "/health",
        "ai_prefix": "/ai",
        "predict_prefix": "/predict",
        "role": "ai_care_companion",
    }

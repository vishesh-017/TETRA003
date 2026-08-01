from datetime import datetime, timezone
from typing import Any, Literal

from pydantic import BaseModel, Field

from app.core.constants import CLINICAL_DISCLAIMER


class AiMeta(BaseModel):
    module: str
    provider: str
    model_hint: str = "rule+exa"
    generated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    assistive: Literal[True] = True
    disclaimer: str = CLINICAL_DISCLAIMER
    extensibility: dict[str, Any] = Field(
        default_factory=lambda: {
            "ml_ready": True,
            "swap_provider_without_api_change": True,
        }
    )


class HealthResponse(BaseModel):
    status: str
    service: str
    environment: str
    exa_configured: bool
    openrouter_configured: bool = False
    openrouter_model: str = ""
    supabase_configured: bool
    ml_hook_configured: bool
    modules: list[str]

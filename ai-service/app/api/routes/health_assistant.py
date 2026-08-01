from fastapi import APIRouter, Depends

from app.api.deps import get_health_assistant_service
from app.schemas.health_assistant import (
    HealthAssistantRequest,
    HealthAssistantResponse,
)
from app.services.health_assistant_service import HealthAssistantService

router = APIRouter(tags=["ai-health-assistant"])


@router.post("/health-assistant", response_model=HealthAssistantResponse)
async def health_assistant(
    body: HealthAssistantRequest,
    service: HealthAssistantService = Depends(get_health_assistant_service),
) -> HealthAssistantResponse:
    """Educational Q&A grounded in Exa / trusted sources. Never diagnoses."""
    return await service.answer(body)

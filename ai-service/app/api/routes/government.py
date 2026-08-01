from fastapi import APIRouter, Depends

from app.api.deps import get_government_guidance_service
from app.schemas.government import (
    GovernmentGuidanceRequest,
    GovernmentGuidanceResponse,
)
from app.services.government_guidance_service import GovernmentGuidanceService

router = APIRouter(tags=["ai-government-guidance"])


@router.post("/government-guidance", response_model=GovernmentGuidanceResponse)
async def government_guidance(
    body: GovernmentGuidanceRequest,
    service: GovernmentGuidanceService = Depends(get_government_guidance_service),
) -> GovernmentGuidanceResponse:
    """PM-JAY / government scheme education via curated facts + Exa."""
    return await service.guide(body)

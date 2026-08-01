from fastapi import APIRouter, Depends

from app.api.deps import get_emergency_checkup_service
from app.schemas.emergency_checkup import (
    EmergencyCheckupRequest,
    EmergencyCheckupResponse,
)
from app.services.emergency_checkup_service import EmergencyCheckupService

router = APIRouter(tags=["ai-emergency-checkup"])


@router.post("/emergency-checkup", response_model=EmergencyCheckupResponse)
async def emergency_checkup(
    body: EmergencyCheckupRequest,
    service: EmergencyCheckupService = Depends(get_emergency_checkup_service),
) -> EmergencyCheckupResponse:
    """Sudden-symptom triage via OpenRouter + structured outcomes."""
    return await service.assess(body)

from fastapi import APIRouter, Depends

from app.api.deps import get_care_companion_service
from app.schemas.care_companion import CareCompanionRequest, CareCompanionResponse
from app.services.care_companion_service import CareCompanionService

router = APIRouter(tags=["ai-care-companion"])


@router.post("/care-companion", response_model=CareCompanionResponse)
def organize_care_plan(
    body: CareCompanionRequest,
    service: CareCompanionService = Depends(get_care_companion_service),
) -> CareCompanionResponse:
    """Organize a doctor discharge summary into a structured daily care plan."""
    return service.organize(body)

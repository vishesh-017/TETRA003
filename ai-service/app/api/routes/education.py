from fastapi import APIRouter, Depends

from app.api.deps import get_education_service
from app.schemas.education import EducationRequest, EducationResponse
from app.services.education_service import EducationService

router = APIRouter(tags=["ai-education"])


@router.post("/education", response_model=EducationResponse)
def localized_education(
    body: EducationRequest,
    service: EducationService = Depends(get_education_service),
) -> EducationResponse:
    """Patient-friendly education in English, Hindi, or Gujarati."""
    return service.generate(body)

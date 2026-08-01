from fastapi import APIRouter, Depends

from app.api.deps import get_patient_summary_service
from app.schemas.patient_summary import PatientSummaryRequest, PatientSummaryResponse
from app.services.patient_summary_service import PatientSummaryService

router = APIRouter(tags=["ai-patient-summary"])


@router.post("/patient-summary", response_model=PatientSummaryResponse)
async def summarize_patient(
    body: PatientSummaryRequest,
    service: PatientSummaryService = Depends(get_patient_summary_service),
) -> PatientSummaryResponse:
    """Produce a short assistive clinical summary (3–5 sentences)."""
    return await service.summarize(body)

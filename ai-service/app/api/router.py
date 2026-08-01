from fastapi import APIRouter

from app.api.routes import (
    care_companion,
    education,
    government,
    health_assistant,
    patient_summary,
)

api_router = APIRouter(prefix="/ai")
api_router.include_router(care_companion.router)
api_router.include_router(patient_summary.router)
api_router.include_router(health_assistant.router)
api_router.include_router(education.router)
api_router.include_router(government.router)

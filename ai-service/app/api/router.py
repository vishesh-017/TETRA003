from fastapi import APIRouter

from app.api.routes import (
    care_companion,
    education,
    emergency_checkup,
    government,
    health_assistant,
    patient_summary,
    predict,
)

api_router = APIRouter()
ai_router = APIRouter(prefix="/ai")
ai_router.include_router(care_companion.router)
ai_router.include_router(patient_summary.router)
ai_router.include_router(health_assistant.router)
ai_router.include_router(emergency_checkup.router)
ai_router.include_router(education.router)
ai_router.include_router(government.router)

api_router.include_router(ai_router)
api_router.include_router(predict.router)

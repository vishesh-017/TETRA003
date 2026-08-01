from functools import lru_cache

from app.providers.base import KnowledgeProvider
from app.providers.factory import build_knowledge_provider
from app.services.care_companion_service import CareCompanionService
from app.services.education_service import EducationService
from app.services.government_guidance_service import GovernmentGuidanceService
from app.services.health_assistant_service import HealthAssistantService
from app.services.patient_summary_service import PatientSummaryService


@lru_cache
def get_knowledge_provider() -> KnowledgeProvider:
    return build_knowledge_provider()


@lru_cache
def get_care_companion_service() -> CareCompanionService:
    return CareCompanionService()


@lru_cache
def get_patient_summary_service() -> PatientSummaryService:
    return PatientSummaryService()


@lru_cache
def get_health_assistant_service() -> HealthAssistantService:
    return HealthAssistantService(get_knowledge_provider())


@lru_cache
def get_education_service() -> EducationService:
    return EducationService()


@lru_cache
def get_government_guidance_service() -> GovernmentGuidanceService:
    return GovernmentGuidanceService(get_knowledge_provider())

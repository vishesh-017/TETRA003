from functools import lru_cache

from app.prediction.engines.alert_decision import AlertDecisionService
from app.prediction.engines.disease_progression import DiseaseProgressionService
from app.prediction.engines.explainability import ExplainabilityService
from app.prediction.engines.lifestyle_simulator import LifestyleSimulatorService
from app.prediction.engines.readmission_risk import ReadmissionRiskService
from app.prediction.engines.recovery_score import RecoveryScoreService
from app.prediction.engines.trend_analysis import TrendAnalysisService
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


@lru_cache
def get_recovery_score_service() -> RecoveryScoreService:
    return RecoveryScoreService()


@lru_cache
def get_readmission_risk_service() -> ReadmissionRiskService:
    return ReadmissionRiskService()


@lru_cache
def get_disease_progression_service() -> DiseaseProgressionService:
    return DiseaseProgressionService()


@lru_cache
def get_trend_analysis_service() -> TrendAnalysisService:
    return TrendAnalysisService()


@lru_cache
def get_lifestyle_simulator_service() -> LifestyleSimulatorService:
    return LifestyleSimulatorService()


@lru_cache
def get_alert_decision_service() -> AlertDecisionService:
    return AlertDecisionService()


@lru_cache
def get_explainability_service() -> ExplainabilityService:
    return ExplainabilityService()

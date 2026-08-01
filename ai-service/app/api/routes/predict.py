from fastapi import APIRouter, Depends

from app.api.deps import (
    get_alert_decision_service,
    get_disease_progression_service,
    get_explainability_service,
    get_lifestyle_simulator_service,
    get_readmission_risk_service,
    get_recovery_score_service,
    get_trend_analysis_service,
)
from app.prediction.engines.alert_decision import AlertDecisionService
from app.prediction.engines.disease_progression import DiseaseProgressionService
from app.prediction.engines.explainability import (
    ExplainabilityService,
    ExplanationRequest,
    ExplanationResponse,
)
from app.prediction.engines.lifestyle_simulator import LifestyleSimulatorService
from app.prediction.engines.readmission_risk import ReadmissionRiskService
from app.prediction.engines.recovery_score import RecoveryScoreService
from app.prediction.engines.trend_analysis import TrendAnalysisService
from app.prediction.schemas.alerts import AlertDecisionRequest, AlertDecisionResponse
from app.prediction.schemas.lifestyle import (
    LifestyleSimulationRequest,
    LifestyleSimulationResponse,
)
from app.prediction.schemas.progression import (
    DiseaseProgressionRequest,
    DiseaseProgressionResponse,
)
from app.prediction.schemas.readmission import (
    ReadmissionRiskRequest,
    ReadmissionRiskResponse,
)
from app.prediction.schemas.recovery import RecoveryScoreRequest, RecoveryScoreResponse
from app.prediction.schemas.trends import TrendAnalysisRequest, TrendAnalysisResponse

router = APIRouter(prefix="/predict", tags=["predictive-intelligence"])


@router.post("/recovery-score", response_model=RecoveryScoreResponse)
def predict_recovery_score(
    body: RecoveryScoreRequest,
    service: RecoveryScoreService = Depends(get_recovery_score_service),
) -> RecoveryScoreResponse:
    return service.compute(body)


@router.post("/readmission", response_model=ReadmissionRiskResponse)
def predict_readmission(
    body: ReadmissionRiskRequest,
    service: ReadmissionRiskService = Depends(get_readmission_risk_service),
) -> ReadmissionRiskResponse:
    return service.compute(body)


@router.post("/disease-progression", response_model=DiseaseProgressionResponse)
def predict_disease_progression(
    body: DiseaseProgressionRequest,
    service: DiseaseProgressionService = Depends(get_disease_progression_service),
) -> DiseaseProgressionResponse:
    return service.compute(body)


@router.post("/trends", response_model=TrendAnalysisResponse)
def predict_trends(
    body: TrendAnalysisRequest,
    service: TrendAnalysisService = Depends(get_trend_analysis_service),
) -> TrendAnalysisResponse:
    return service.compute(body)


@router.post("/lifestyle-simulation", response_model=LifestyleSimulationResponse)
def predict_lifestyle_simulation(
    body: LifestyleSimulationRequest,
    service: LifestyleSimulatorService = Depends(get_lifestyle_simulator_service),
) -> LifestyleSimulationResponse:
    return service.simulate(body)


@router.post("/alerts", response_model=AlertDecisionResponse)
def predict_alerts(
    body: AlertDecisionRequest,
    service: AlertDecisionService = Depends(get_alert_decision_service),
) -> AlertDecisionResponse:
    return service.decide(body)


@router.post("/explain", response_model=ExplanationResponse)
def predict_explain(
    body: ExplanationRequest,
    recovery_svc: RecoveryScoreService = Depends(get_recovery_score_service),
    readmit_svc: ReadmissionRiskService = Depends(get_readmission_risk_service),
    explain_svc: ExplainabilityService = Depends(get_explainability_service),
) -> ExplanationResponse:
    """Structured WHY for recovery + readmission (assistive explainability)."""
    recovery = body.recovery or recovery_svc.compute(
        RecoveryScoreRequest(**body.observations.model_dump())
    )
    readmission = body.readmission or readmit_svc.compute(
        ReadmissionRiskRequest(
            **body.observations.model_dump(),
            recovery_score=recovery.recovery_score,
        )
    )
    return explain_svc.explain(
        ExplanationRequest(
            observations=body.observations,
            recovery=recovery,
            readmission=readmission,
            focus=body.focus,
        )
    )

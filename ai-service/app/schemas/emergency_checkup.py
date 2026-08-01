from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import AiMeta


class EmergencyCheckupRequest(BaseModel):
    symptoms: str = Field(..., min_length=2, max_length=2000)
    patient_context: str | None = Field(
        default=None,
        description="Live patient snapshot JSON/text from HealNexus webapp",
    )
    locale: str = "en"


class DiseaseRiskItem(BaseModel):
    key: str
    label: str
    score: int = Field(ge=0, le=100)
    band: Literal["low", "moderate", "high", "critical"]


class MissingInvestigationItem(BaseModel):
    test_name: str
    priority: str
    reason: str
    evidence_basis: str = ""


class EmergencyCheckupResponse(BaseModel):
    title: str
    summary: str
    criticality: Literal["low", "moderate", "high", "critical"]
    criticality_score: int = Field(ge=0, le=100)
    is_emergency: bool
    warning_signals: list[str] = Field(default_factory=list)
    next_actions: list[str] = Field(default_factory=list)
    when_to_call_108: list[str] = Field(default_factory=list)
    early_warnings: list[str] = Field(default_factory=list)
    disease_risks: list[DiseaseRiskItem] = Field(default_factory=list)
    missing_investigations: list[MissingInvestigationItem] = Field(
        default_factory=list
    )
    referral: dict = Field(default_factory=dict)
    provider: str = "openrouter"
    disclaimer: str
    meta: AiMeta

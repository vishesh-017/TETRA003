"""Explainability Engine — structured WHY for any prediction bundle."""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.prediction.schemas.common import (
    ContributingFactor,
    PatientObservationBundle,
    PredictionMeta,
)
from app.prediction.schemas.readmission import ReadmissionRiskResponse
from app.prediction.schemas.recovery import RecoveryScoreResponse


class ExplanationRequest(BaseModel):
    observations: PatientObservationBundle
    recovery: RecoveryScoreResponse | None = None
    readmission: ReadmissionRiskResponse | None = None
    focus: str = "readmission"


class ExplanationBlock(BaseModel):
    title: str
    bullets: list[str]
    factors: list[ContributingFactor] = Field(default_factory=list)


class ExplanationResponse(BaseModel):
    why: ExplanationBlock
    what_changed: list[str]
    meta: PredictionMeta


class ExplainabilityService:
    name = "explainability"

    def explain(self, payload: ExplanationRequest) -> ExplanationResponse:
        bullets: list[str] = []
        factors: list[ContributingFactor] = []
        changes: list[str] = []

        if payload.readmission:
            bullets.extend(payload.readmission.explanation)
            factors.extend(payload.readmission.contributing_factors)
            changes.append(
                f"Readmission probability estimated at "
                f"{payload.readmission.readmission_probability_percent:.0f}% "
                f"({payload.readmission.risk_category})."
            )

        if payload.recovery:
            neg = [
                f
                for f in payload.recovery.contributing_factors
                if f.impact == "negative"
            ]
            for f in neg[:4]:
                bullets.append(f"{f.factor.replace('_', ' ').title()}: {f.detail}")
            factors.extend(neg)
            changes.append(
                f"Recovery Score is {payload.recovery.recovery_score:.0f}/100 "
                f"({payload.recovery.recovery_level})."
            )

        # Deduplicate bullets
        seen: set[str] = set()
        unique_bullets: list[str] = []
        for b in bullets:
            if b not in seen:
                seen.add(b)
                unique_bullets.append(b)

        if not unique_bullets:
            unique_bullets = [
                "No major negative drivers detected in the current observation window."
            ]

        title = (
            "Readmission Risk increased because"
            if payload.focus == "readmission"
            and payload.readmission
            and payload.readmission.risk_category in {"high", "critical", "medium"}
            else "Key drivers behind the current prediction"
        )

        return ExplanationResponse(
            why=ExplanationBlock(
                title=title,
                bullets=unique_bullets,
                factors=factors[:8],
            ),
            what_changed=changes,
            meta=PredictionMeta(engine=self.name, impl="factor_attribution_v1"),
        )

"""Alert Decision Engine — map predictions to care-team actions."""

from __future__ import annotations

from app.core.logging import get_logger
from app.prediction.engines.readmission_risk import ReadmissionRiskService
from app.prediction.engines.recovery_score import RecoveryScoreService
from app.prediction.schemas.alerts import (
    AlertAction,
    AlertDecisionRequest,
    AlertDecisionResponse,
)
from app.prediction.schemas.common import PredictionMeta
from app.prediction.schemas.readmission import ReadmissionRiskRequest
from app.prediction.schemas.recovery import RecoveryScoreRequest
from app.prediction.utils import latest

logger = get_logger(__name__)


class AlertDecisionService:
    name = "alert_decision"

    def __init__(self) -> None:
        self._recovery = RecoveryScoreService()
        self._readmission = ReadmissionRiskService()

    def decide(self, payload: AlertDecisionRequest) -> AlertDecisionResponse:
        logger.info("AlertDecision patient=%s", payload.patient_id)

        obs = payload.model_dump(
            exclude={"recovery_score", "readmission_probability_percent"}
        )
        obs.pop("recovery_score", None)
        obs.pop("readmission_probability_percent", None)

        recovery_score = payload.recovery_score
        if recovery_score is None:
            recovery_score = self._recovery.compute(
                RecoveryScoreRequest.model_validate(obs)
            ).recovery_score

        readmit_pct = payload.readmission_probability_percent
        if readmit_pct is None:
            readmit_pct = self._readmission.compute(
                ReadmissionRiskRequest.model_validate(
                    {**obs, "recovery_score": recovery_score}
                )
            ).readmission_probability_percent

        rationale: list[str] = []
        action: AlertAction = "no_action"
        urgency = 1

        sys_v = latest(payload.blood_pressure_systolic)
        sugar_v = latest(payload.blood_sugar)
        symptoms = (
            [s.lower() for s in payload.symptom_log[-1].symptoms]
            if payload.symptom_log
            else []
        )
        emergency_symptoms = {
            "chest pain",
            "chest discomfort",
            "confusion",
            "fainting",
            "severe shortness of breath",
            "shortness of breath",
        }

        if any(s in emergency_symptoms for s in symptoms) or (
            sugar_v is not None and sugar_v >= 300
        ) or (sys_v is not None and sys_v >= 180):
            action = "emergency"
            urgency = 5
            rationale.append("Potential emergency-range vitals or red-flag symptoms")
        elif recovery_score < 40 or readmit_pct >= 75:
            action = "immediate_attention"
            urgency = 4
            rationale.append(
                f"Critical recovery/readmission signal (score={recovery_score:.0f}, "
                f"readmit≈{readmit_pct:.0f}%)"
            )
        elif recovery_score < 60 or readmit_pct >= 55:
            action = "doctor_review"
            urgency = 3
            rationale.append(
                "Elevated deterioration signals warrant clinician review"
            )
        elif recovery_score < 75 or readmit_pct >= 35 or payload.missed_medicine_doses_7d >= 2:
            action = "monitor"
            urgency = 2
            rationale.append("Mild-moderate risk — continue close monitoring")
        else:
            action = "no_action"
            urgency = 1
            rationale.append("No escalation thresholds crossed")

        if payload.missed_appointments_30d and action in {"no_action", "monitor"}:
            action = "monitor"
            urgency = max(urgency, 2)
            rationale.append("Missed appointment increases need for outreach")

        titles = {
            "no_action": "Continue current care plan",
            "monitor": "Monitor recovery closely",
            "doctor_review": "Doctor review recommended",
            "immediate_attention": "Immediate clinical attention advised",
            "emergency": "Emergency evaluation recommended",
        }

        return AlertDecisionResponse(
            action=action,
            urgency=urgency,
            title=titles[action],
            rationale=rationale,
            clinician_message=(
                f"Assistive alert: {titles[action]}. "
                f"Recovery≈{recovery_score:.0f}/100, readmission≈{readmit_pct:.0f}%. "
                "Final decision remains with the clinician."
            ),
            patient_message=(
                "Based on your recent logs, your care team may want to review your "
                "progress. This is not a diagnosis — follow your approved care plan "
                "and seek urgent care for emergency warning signs."
            ),
            meta=PredictionMeta(engine=self.name, impl="threshold_policy_v1"),
        )

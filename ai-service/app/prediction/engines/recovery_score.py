"""Recovery Score Service — primary post-discharge KPI (0–100)."""

from __future__ import annotations

from app.core.logging import get_logger
from app.prediction.schemas.common import ContributingFactor, PredictionMeta
from app.prediction.schemas.recovery import (
    RecoveryLevel,
    RecoveryScoreRequest,
    RecoveryScoreResponse,
)
from app.prediction.utils import (
    clamp,
    inverse_pain_score,
    latest,
    pct_or_default,
    score_from_range,
    series_values,
    trend_direction,
)

logger = get_logger(__name__)

WEIGHTS = {
    "medicine_adherence": 0.20,
    "blood_pressure": 0.12,
    "blood_sugar": 0.12,
    "sleep": 0.08,
    "water_intake": 0.06,
    "exercise": 0.08,
    "symptoms": 0.10,
    "pain": 0.08,
    "temperature": 0.04,
    "weight_trend": 0.04,
    "appointment_adherence": 0.04,
    "checkin_completion": 0.04,
}


class RecoveryScoreService:
    name = "recovery_score"

    def compute(self, payload: RecoveryScoreRequest) -> RecoveryScoreResponse:
        logger.info(
            "RecoveryScore patient=%s adherence=%s",
            payload.patient_id,
            payload.medicine_adherence_percent,
        )

        factor_scores: dict[str, float] = {}
        factors: list[ContributingFactor] = []

        # Medicine adherence
        med = pct_or_default(payload.medicine_adherence_percent, 65.0)
        if payload.missed_medicine_doses_7d >= 3:
            med = clamp(med - 15)
        factor_scores["medicine_adherence"] = med
        factors.append(
            ContributingFactor(
                factor="medicine_adherence",
                impact="positive" if med >= 80 else "negative",
                weight=WEIGHTS["medicine_adherence"],
                detail=f"Adherence ≈ {med:.0f}%",
                evidence=f"Missed doses (7d): {payload.missed_medicine_doses_7d}",
            )
        )

        # BP
        sys_v = latest(payload.blood_pressure_systolic)
        bp = score_from_range(
            sys_v, ideal_low=110, ideal_high=130, warn_low=95, warn_high=150
        )
        factor_scores["blood_pressure"] = bp
        factors.append(
            ContributingFactor(
                factor="blood_pressure",
                impact="positive" if bp >= 75 else "negative",
                weight=WEIGHTS["blood_pressure"],
                detail=f"Latest systolic: {sys_v if sys_v is not None else 'n/a'}",
            )
        )

        # Sugar
        sugar_v = latest(payload.blood_sugar)
        sugar = score_from_range(
            sugar_v, ideal_low=80, ideal_high=140, warn_low=70, warn_high=180
        )
        sugar_vals = series_values(payload.blood_sugar)
        if trend_direction(sugar_vals) == "increasing":
            sugar = clamp(sugar - 12)
        factor_scores["blood_sugar"] = sugar
        factors.append(
            ContributingFactor(
                factor="blood_sugar",
                impact="positive" if sugar >= 75 else "negative",
                weight=WEIGHTS["blood_sugar"],
                detail=f"Latest sugar: {sugar_v if sugar_v is not None else 'n/a'}",
                evidence=f"Trend: {trend_direction(sugar_vals)}",
            )
        )

        # Sleep
        sleep_v = latest(payload.sleep_hours)
        sleep = score_from_range(
            sleep_v, ideal_low=7, ideal_high=9, warn_low=5, warn_high=11
        )
        factor_scores["sleep"] = sleep
        factors.append(
            ContributingFactor(
                factor="sleep",
                impact="positive" if sleep >= 75 else "negative",
                weight=WEIGHTS["sleep"],
                detail=f"Latest sleep hours: {sleep_v if sleep_v is not None else 'n/a'}",
            )
        )

        # Water
        water_v = latest(payload.water_intake_glasses)
        water = score_from_range(
            water_v, ideal_low=6, ideal_high=10, warn_low=3, warn_high=14
        )
        factor_scores["water_intake"] = water
        factors.append(
            ContributingFactor(
                factor="water_intake",
                impact="positive" if water >= 70 else "neutral",
                weight=WEIGHTS["water_intake"],
                detail=f"Glasses/day: {water_v if water_v is not None else 'n/a'}",
            )
        )

        # Exercise
        ex_v = latest(payload.exercise_minutes)
        exercise = score_from_range(
            ex_v, ideal_low=20, ideal_high=45, warn_low=5, warn_high=90
        )
        factor_scores["exercise"] = exercise
        factors.append(
            ContributingFactor(
                factor="exercise",
                impact="positive" if exercise >= 70 else "negative",
                weight=WEIGHTS["exercise"],
                detail=f"Minutes: {ex_v if ex_v is not None else 'n/a'}",
            )
        )

        # Symptoms (fewer/lower severity better)
        if payload.symptom_log:
            last = payload.symptom_log[-1]
            count = len(last.symptoms)
            sev = last.severity if last.severity is not None else min(10, count * 2)
            symptoms = clamp(100 - count * 12 - sev * 4)
        else:
            symptoms = 78.0
        factor_scores["symptoms"] = symptoms
        factors.append(
            ContributingFactor(
                factor="symptoms",
                impact="positive" if symptoms >= 75 else "negative",
                weight=WEIGHTS["symptoms"],
                detail=f"Symptom burden score {symptoms:.0f}/100",
            )
        )

        # Pain
        pain = inverse_pain_score(payload.current_pain_score)
        if payload.symptom_log and payload.symptom_log[-1].pain_score is not None:
            pain = inverse_pain_score(payload.symptom_log[-1].pain_score)
        factor_scores["pain"] = pain
        factors.append(
            ContributingFactor(
                factor="pain",
                impact="positive" if pain >= 70 else "negative",
                weight=WEIGHTS["pain"],
                detail=f"Pain contribution {pain:.0f}/100",
            )
        )

        # Temperature
        temp_v = latest(payload.temperature_f)
        temp = score_from_range(
            temp_v, ideal_low=97.5, ideal_high=99.0, warn_low=96.5, warn_high=100.4
        )
        factor_scores["temperature"] = temp
        factors.append(
            ContributingFactor(
                factor="temperature",
                impact="neutral" if temp >= 70 else "negative",
                weight=WEIGHTS["temperature"],
                detail=f"Temp °F: {temp_v if temp_v is not None else 'n/a'}",
            )
        )

        # Weight trend (rapid gain = worse for many recovery contexts)
        w_vals = series_values(payload.weight_kg)
        w_dir = trend_direction(w_vals, epsilon=0.4)
        if w_dir == "increasing":
            weight = 55.0
        elif w_dir == "decreasing":
            weight = 72.0
        elif w_dir == "stable":
            weight = 85.0
        else:
            weight = 70.0
        factor_scores["weight_trend"] = weight
        factors.append(
            ContributingFactor(
                factor="weight_trend",
                impact="positive" if weight >= 75 else "negative",
                weight=WEIGHTS["weight_trend"],
                detail=f"Weight trend: {w_dir}",
            )
        )

        # Appointments / check-ins
        appt = pct_or_default(payload.appointment_adherence_percent, 70.0)
        if payload.missed_appointments_30d:
            appt = clamp(appt - payload.missed_appointments_30d * 12)
        factor_scores["appointment_adherence"] = appt
        factors.append(
            ContributingFactor(
                factor="appointment_adherence",
                impact="positive" if appt >= 80 else "negative",
                weight=WEIGHTS["appointment_adherence"],
                detail=f"Appointment adherence ≈ {appt:.0f}%",
            )
        )

        checkin = pct_or_default(payload.checkin_completion_percent, 65.0)
        factor_scores["checkin_completion"] = checkin
        factors.append(
            ContributingFactor(
                factor="checkin_completion",
                impact="positive" if checkin >= 75 else "neutral",
                weight=WEIGHTS["checkin_completion"],
                detail=f"Check-in completion ≈ {checkin:.0f}%",
            )
        )

        score = sum(factor_scores[k] * WEIGHTS[k] for k in WEIGHTS)
        score = round(clamp(score), 1)
        level = self._level(score)
        top = sorted(factors, key=lambda f: f.weight, reverse=True)[:5]
        summary = (
            f"Recovery Score is {score:.0f}/100 ({level.replace('_', ' ')}). "
            f"Strongest drivers: {', '.join(t.factor.replace('_', ' ') for t in top[:3])}."
        )

        return RecoveryScoreResponse(
            recovery_score=score,
            recovery_level=level,
            contributing_factors=factors,
            factor_scores={k: round(v, 1) for k, v in factor_scores.items()},
            summary=summary,
            meta=PredictionMeta(engine=self.name, impl="weighted_rule_v1"),
        )

    def _level(self, score: float) -> RecoveryLevel:
        if score >= 90:
            return "excellent"
        if score >= 75:
            return "good"
        if score >= 60:
            return "moderate"
        if score >= 40:
            return "needs_attention"
        return "critical"

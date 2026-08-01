from app.prediction.engines.recovery_score import RecoveryScoreService
from app.prediction.schemas.common import TimedValue
from app.prediction.schemas.recovery import RecoveryScoreRequest


def test_recovery_score_high_when_vitals_good():
    svc = RecoveryScoreService()
    result = svc.compute(
        RecoveryScoreRequest(
            medicine_adherence_percent=95,
            missed_medicine_doses_7d=0,
            appointment_adherence_percent=100,
            checkin_completion_percent=90,
            blood_pressure_systolic=[TimedValue(value=120)],
            blood_sugar=[TimedValue(value=110), TimedValue(value=112)],
            sleep_hours=[TimedValue(value=8)],
            water_intake_glasses=[TimedValue(value=8)],
            exercise_minutes=[TimedValue(value=30)],
            temperature_f=[TimedValue(value=98.6)],
            weight_kg=[TimedValue(value=70), TimedValue(value=70.1)],
            current_pain_score=1,
            symptom_log=[],
        )
    )
    assert result.recovery_score >= 75
    assert result.recovery_level in {"excellent", "good"}


def test_recovery_score_drops_with_poor_signals():
    svc = RecoveryScoreService()
    result = svc.compute(
        RecoveryScoreRequest(
            medicine_adherence_percent=40,
            missed_medicine_doses_7d=5,
            blood_pressure_systolic=[TimedValue(value=168)],
            blood_sugar=[
                TimedValue(value=160),
                TimedValue(value=180),
                TimedValue(value=210),
            ],
            current_pain_score=8,
            symptom_log=[{"symptoms": ["Fatigue", "Dizziness"], "severity": 8}],
        )
    )
    assert result.recovery_score < 60
    assert result.recovery_level in {"needs_attention", "critical", "moderate"}

"""
Future XGBoost / Random Forest adapters.

HTTP contracts under `/predict/*` stay stable. Replace rule engines by injecting
implementations that match RecoveryModel / ReadmissionModel / ProgressionModel.
"""

from app.prediction.models.base import ProgressionModel, ReadmissionModel, RecoveryModel
from app.prediction.schemas.common import PatientObservationBundle


class PlaceholderXgbRecoveryModel:
    """Stub showing how an ML model would plug in later."""

    def predict(self, observations: PatientObservationBundle) -> dict:
        return {
            "status": "not_trained",
            "message": "Train XGBoost and load artifact via ML_INFERENCE_URL / local path.",
            "patient_id": observations.patient_id,
        }


def get_ml_recovery_model() -> RecoveryModel:
    return PlaceholderXgbRecoveryModel()


def get_ml_readmission_model() -> ReadmissionModel:
    return PlaceholderXgbRecoveryModel()  # type: ignore[return-value]


def get_ml_progression_model() -> ProgressionModel:
    return PlaceholderXgbRecoveryModel()  # type: ignore[return-value]

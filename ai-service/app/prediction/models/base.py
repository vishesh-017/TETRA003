"""Future ML model contracts — swap implementations without changing HTTP APIs."""

from typing import Protocol

from app.prediction.schemas.common import PatientObservationBundle


class RecoveryModel(Protocol):
    def predict(self, observations: PatientObservationBundle) -> dict: ...


class ReadmissionModel(Protocol):
    def predict(self, observations: PatientObservationBundle) -> dict: ...


class ProgressionModel(Protocol):
    def predict(self, observations: PatientObservationBundle) -> dict: ...

"""SQLAlchemy models package — import all models for metadata registration."""

from app.models.clinical import (
    Appointment,
    CaregiverAssignment,
    CarePlan,
    CareRelationship,
    DailyTask,
    DischargeSummary,
    Medicine,
)
from app.models.enums import UserRole
from app.models.government import AbdmImport, Hospital, PmjayGuidance
from app.models.monitoring import (
    Alert,
    DailyCheckIn,
    HealthReport,
    MedicineEvent,
    Notification,
    RiskPrediction,
)
from app.models.passport import PatientPassport
from app.models.rural import HealthWorkerRecord, SyncMutation
from app.models.user import Caregiver, Doctor, HealthWorker, Patient, User

__all__ = [
    "User",
    "Doctor",
    "Patient",
    "Caregiver",
    "HealthWorker",
    "UserRole",
    "CareRelationship",
    "CaregiverAssignment",
    "DischargeSummary",
    "CarePlan",
    "Medicine",
    "DailyTask",
    "Appointment",
    "DailyCheckIn",
    "MedicineEvent",
    "RiskPrediction",
    "Alert",
    "Notification",
    "HealthReport",
    "PatientPassport",
    "PmjayGuidance",
    "Hospital",
    "AbdmImport",
    "HealthWorkerRecord",
    "SyncMutation",
]

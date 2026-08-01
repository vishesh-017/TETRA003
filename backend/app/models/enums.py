"""Shared enumerations for database models and API schemas."""

import enum


class UserRole(str, enum.Enum):
    DOCTOR = "doctor"
    PATIENT = "patient"
    CAREGIVER = "caregiver"
    HEALTH_WORKER = "health_worker"


class CareRelationshipStatus(str, enum.Enum):
    ACTIVE = "active"
    ENDED = "ended"


class CarePlanStatus(str, enum.Enum):
    AI_DRAFT = "ai_draft"
    DOCTOR_APPROVED = "doctor_approved"
    ACTIVE = "active"
    COMPLETED = "completed"


class DischargeSource(str, enum.Enum):
    UPLOAD = "upload"
    MANUAL = "manual"


class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    MISSED = "missed"


class MedicineEventStatus(str, enum.Enum):
    TAKEN = "taken"
    SKIPPED = "skipped"
    MISSED = "missed"


class RiskLevel(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    CRITICAL = "critical"


class AlertStatus(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"
    SMS = "sms"


class HospitalType(str, enum.Enum):
    GOVERNMENT = "government"
    PMJAY = "pmjay"
    EMERGENCY = "emergency"
    PRIVATE = "private"


class WorkerType(str, enum.Enum):
    ASHA = "asha"
    ANM = "anm"


class SyncState(str, enum.Enum):
    PENDING = "pending"
    SYNCED = "synced"
    CONFLICT = "conflict"

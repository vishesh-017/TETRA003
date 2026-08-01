"""Shared FastAPI dependencies."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser, get_current_user, require_roles
from app.db.session import get_db
from app.models.enums import UserRole

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]

DoctorUser = Annotated[
    AuthenticatedUser,
    Depends(require_roles(UserRole.DOCTOR)),
]
PatientUser = Annotated[
    AuthenticatedUser,
    Depends(require_roles(UserRole.PATIENT)),
]
CaregiverUser = Annotated[
    AuthenticatedUser,
    Depends(require_roles(UserRole.CAREGIVER)),
]
HealthWorkerUser = Annotated[
    AuthenticatedUser,
    Depends(require_roles(UserRole.HEALTH_WORKER)),
]
ClinicalStaffUser = Annotated[
    AuthenticatedUser,
    Depends(
        require_roles(
            UserRole.DOCTOR,
            UserRole.CAREGIVER,
            UserRole.HEALTH_WORKER,
        )
    ),
]

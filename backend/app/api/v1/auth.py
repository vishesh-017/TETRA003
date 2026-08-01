"""Authentication and current-user endpoints."""

from fastapi import APIRouter, HTTPException, status

from app.api.deps import CurrentUser, DbSession
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.user import (
    CaregiverProfileRead,
    DoctorProfileRead,
    HealthWorkerProfileRead,
    MeResponse,
    PatientProfileRead,
    UserRead,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=MeResponse)
def get_me(user: CurrentUser, db: DbSession) -> MeResponse:
    """Return the authenticated principal and linked role profile if present."""
    db_user = db.get(User, user.id)
    if db_user is None:
        # Scaffold response from JWT until profile bootstrap is implemented
        return MeResponse(
            user=UserRead(
                id=user.id,
                email=user.email,
                full_name=user.email or "HealNexus User",
                phone=None,
                role=user.role,
                locale="en",
                avatar_url=None,
                is_active=True,
            )
        )

    payload = MeResponse(user=UserRead.model_validate(db_user))

    if db_user.role == UserRole.DOCTOR and db_user.doctor_profile:
        payload.doctor = DoctorProfileRead.model_validate(db_user.doctor_profile)
    elif db_user.role == UserRole.PATIENT and db_user.patient_profile:
        payload.patient = PatientProfileRead.model_validate(db_user.patient_profile)
    elif db_user.role == UserRole.CAREGIVER and db_user.caregiver_profile:
        payload.caregiver = CaregiverProfileRead.model_validate(db_user.caregiver_profile)
    elif db_user.role == UserRole.HEALTH_WORKER and db_user.health_worker_profile:
        payload.health_worker = HealthWorkerProfileRead.model_validate(
            db_user.health_worker_profile
        )

    return payload


@router.post("/logout", response_model=MessageResponse)
def logout(_: CurrentUser) -> MessageResponse:
    """Stateless JWT logout acknowledgement — client clears Supabase session."""
    return MessageResponse(
        message="Logged out. Clear the client session to complete logout.",
        code="LOGGED_OUT",
    )


@router.get("/roles", response_model=list[str])
def list_roles(_: CurrentUser) -> list[str]:
    return [role.value for role in UserRole]


@router.get("/protected/doctor", response_model=MessageResponse)
def doctor_only(user: CurrentUser) -> MessageResponse:
    if user.role != UserRole.DOCTOR:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Doctor role required")
    return MessageResponse(message=f"Doctor access granted for {user.id}", code="OK")

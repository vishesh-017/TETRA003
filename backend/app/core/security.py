"""JWT verification against Supabase Auth tokens."""

from dataclasses import dataclass
from typing import Any, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.models.enums import UserRole

logger = get_logger(__name__)
bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthenticatedUser:
    """Normalized identity extracted from a verified Supabase JWT."""

    id: UUID
    email: Optional[str]
    role: UserRole
    raw_claims: dict[str, Any]


def decode_supabase_token(token: str, settings: Settings) -> dict[str, Any]:
    """Decode and verify a Supabase-issued JWT."""
    if not settings.supabase_jwt_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="SUPABASE_JWT_SECRET is not configured",
        )

    try:
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
    except JWTError as exc:
        logger.warning("JWT verification failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def extract_role(claims: dict[str, Any]) -> UserRole:
    """Resolve application role from JWT claims or default to patient."""
    app_metadata = claims.get("app_metadata") or {}
    user_metadata = claims.get("user_metadata") or {}

    raw_role = (
        app_metadata.get("role")
        or user_metadata.get("role")
        or claims.get("role")
        or UserRole.PATIENT.value
    )

    try:
        return UserRole(str(raw_role).lower())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unsupported role: {raw_role}",
        ) from exc


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUser:
    """FastAPI dependency that requires a valid Bearer JWT."""
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    claims = decode_supabase_token(credentials.credentials, settings)
    subject = claims.get("sub")
    if not subject:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject missing",
        )

    try:
        user_id = UUID(str(subject))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token subject",
        ) from exc

    return AuthenticatedUser(
        id=user_id,
        email=claims.get("email"),
        role=extract_role(claims),
        raw_claims=claims,
    )


def require_roles(*allowed_roles: UserRole):
    """Dependency factory enforcing role-based access control."""

    async def _checker(
        user: AuthenticatedUser = Depends(get_current_user),
    ) -> AuthenticatedUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return user

    return _checker

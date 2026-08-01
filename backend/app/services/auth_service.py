"""Authentication-related service stubs (no business logic yet)."""

from sqlalchemy.orm import Session

from app.core.security import AuthenticatedUser
from app.models.user import User


class AuthService:
    """Resolves application user records for authenticated principals."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user_by_id(self, user_id) -> User | None:
        return self.db.get(User, user_id)

    def ensure_scaffold_ready(self, principal: AuthenticatedUser) -> AuthenticatedUser:
        """Placeholder for profile bootstrap — implemented in a later phase."""
        return principal

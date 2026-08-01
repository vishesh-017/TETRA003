"""Import Base and all models so metadata is complete for migrations."""

from app.models import *  # noqa: F401,F403
from app.models.base import Base

__all__ = ["Base"]

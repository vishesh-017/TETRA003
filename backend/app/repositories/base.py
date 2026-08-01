"""Generic repository base for future CRUD services."""

from typing import Generic, Optional, Type, TypeVar
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, model: Type[ModelT], db: Session) -> None:
        self.model = model
        self.db = db

    def get_by_id(self, entity_id: UUID) -> Optional[ModelT]:
        return self.db.get(self.model, entity_id)

    def add(self, entity: ModelT) -> ModelT:
        self.db.add(entity)
        return entity

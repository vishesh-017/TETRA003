"""Shared Pydantic schemas."""

from datetime import datetime
from typing import Generic, List, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    message: str
    code: str = "OK"


class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    page: int
    page_size: int
    total: int


class TimestampSchema(ORMModel):
    id: UUID
    created_at: datetime
    updated_at: datetime


class HealthResponse(BaseModel):
    status: str
    service: str
    environment: str
    version: str


class ReadyResponse(BaseModel):
    status: str
    database: str
    detail: Optional[str] = None

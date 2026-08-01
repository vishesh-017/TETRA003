from typing import Literal

from pydantic import BaseModel, Field

from app.core.constants import EDUCATION_TOPICS, SUPPORTED_LOCALES
from app.schemas.common import AiMeta

Topic = Literal["medicine", "diet", "exercise", "recovery", "lifestyle"]
Locale = Literal["en", "hi", "gu"]


class EducationRequest(BaseModel):
    topic: Topic = Field(description=f"One of {EDUCATION_TOPICS}")
    locale: Locale = Field(default="en", description=f"One of {SUPPORTED_LOCALES}")
    condition_context: str | None = Field(
        default=None,
        description="Optional high-level context e.g. 'diabetes recovery' — not a diagnosis request.",
    )
    reading_level: Literal["simple", "standard"] = "simple"


class EducationResponse(BaseModel):
    topic: Topic
    locale: Locale
    title: str
    content: str
    bullet_points: list[str]
    reminder: str
    meta: AiMeta

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.common import AiMeta


class GovernmentGuidanceRequest(BaseModel):
    topic: Literal["pmjay", "abha", "documents", "hospitals", "benefits"] = "pmjay"
    question: str | None = Field(
        default=None,
        max_length=1000,
        description="Optional free-text question about government health schemes.",
    )
    locale: str = "en"
    city_hint: str | None = Field(default="Ahmedabad")


class GovernmentGuidanceResponse(BaseModel):
    title: str
    summary: str
    benefits: list[str]
    documents: list[str]
    hospital_tips: list[str]
    official_links: list[dict[str, str]]
    simple_steps: list[str]
    disclaimer: str
    meta: AiMeta

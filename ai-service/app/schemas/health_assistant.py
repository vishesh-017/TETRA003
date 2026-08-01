from pydantic import BaseModel, Field

from app.schemas.common import AiMeta


class HealthAssistantRequest(BaseModel):
    question: str = Field(min_length=3, max_length=2000)
    locale: str = "en"
    patient_context: str | None = Field(
        default=None,
        description="Optional non-identifying recovery context (no diagnosis requests).",
    )


class SourceRef(BaseModel):
    title: str
    url: str
    snippet: str


class HealthAssistantResponse(BaseModel):
    summary: str
    key_points: list[str]
    when_to_contact_doctor: list[str]
    disclaimer: str
    sources: list[SourceRef]
    meta: AiMeta

from pydantic import BaseModel, Field

from app.schemas.common import AiMeta


class HealthAssistantRequest(BaseModel):
    model_config = {"extra": "ignore"}

    question: str = Field(min_length=1, max_length=2000)
    locale: str = "en"
    patient_context: str | None = Field(
        default=None,
        description="Optional non-identifying recovery context (no diagnosis requests).",
    )
    conversation: list[dict] | None = Field(
        default=None,
        description="Optional prior turns from the webapp (ignored if unused).",
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

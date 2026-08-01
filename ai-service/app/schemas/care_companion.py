from pydantic import BaseModel, Field

from app.schemas.common import AiMeta


class CareCompanionRequest(BaseModel):
    diagnosis: str | None = None
    medicines: str | None = Field(
        default=None,
        description="Doctor-authored medicine list only — AI must not invent medicines.",
    )
    doctor_notes: str | None = None
    diet_advice: str | None = None
    exercise_advice: str | None = None
    restrictions: str | None = None
    special_instructions: str | None = None
    follow_up_date: str | None = None
    hospital_name: str | None = None
    patient_name: str | None = None
    locale: str = "en"


class ScheduleItem(BaseModel):
    title: str
    detail: str
    category: str = Field(
        description="medicine | meal | activity | monitoring | rest | hydration"
    )


class DailySchedule(BaseModel):
    morning: list[ScheduleItem]
    afternoon: list[ScheduleItem]
    evening: list[ScheduleItem]
    night: list[ScheduleItem]


class CareCompanionResponse(BaseModel):
    daily_schedule: DailySchedule
    patient_friendly_explanation: str
    caregiver_instructions: str
    warning_signs: list[str]
    next_steps: list[str]
    organized_medicines: list[dict[str, str | None]]
    meta: AiMeta

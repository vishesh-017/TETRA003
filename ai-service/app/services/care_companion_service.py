"""AI Care Companion — organizes doctor discharge content. Never invents medicines."""

from __future__ import annotations

import re

from app.core.logging import get_logger
from app.schemas.care_companion import (
    CareCompanionRequest,
    CareCompanionResponse,
    DailySchedule,
    ScheduleItem,
)
from app.schemas.common import AiMeta

logger = get_logger(__name__)


class CareCompanionService:
    module_name = "care_companion"

    def organize(self, payload: CareCompanionRequest) -> CareCompanionResponse:
        logger.info(
            "CareCompanion organize diagnosis=%r medicines_len=%s",
            (payload.diagnosis or "")[:60],
            len(payload.medicines or ""),
        )
        medicines = self._parse_medicines(payload.medicines)
        schedule = self._build_schedule(payload, medicines)
        explanation = self._patient_explanation(payload, medicines)
        caregiver = self._caregiver_instructions(payload, medicines)
        warnings = self._warning_signs(payload)
        next_steps = self._next_steps(payload)

        return CareCompanionResponse(
            daily_schedule=schedule,
            patient_friendly_explanation=explanation,
            caregiver_instructions=caregiver,
            warning_signs=warnings,
            next_steps=next_steps,
            organized_medicines=medicines,
            meta=AiMeta(
                module=self.module_name,
                provider="deterministic_organizer",
                model_hint="rule_based_v1",
            ),
        )

    def _parse_medicines(
        self,
        medicines_text: str | None,
    ) -> list[dict[str, str | None]]:
        if not medicines_text or not medicines_text.strip():
            return []

        items: list[dict[str, str | None]] = []
        for raw in medicines_text.splitlines():
            line = raw.strip().lstrip("-•\t ").strip()
            if not line:
                continue
            match = re.match(
                r"^(?P<name>[A-Za-z][A-Za-z0-9 \-/]+?)"
                r"(?:\s+(?P<dose>\d+\s*(?:mg|mcg|g|ml|IU)%?))?"
                r"(?:\s*[-–,]\s*|\s+)(?P<freq>.+)$",
                line,
                flags=re.IGNORECASE,
            )
            if match:
                groups = match.groupdict()
                items.append(
                    {
                        "name": groups["name"].strip(),
                        "dose": (groups.get("dose") or None),
                        "frequency": groups["freq"].strip(),
                        "instructions": "Take exactly as prescribed by your doctor.",
                    }
                )
            else:
                items.append(
                    {
                        "name": line,
                        "dose": None,
                        "frequency": "As directed by doctor",
                        "instructions": "Take exactly as prescribed by your doctor.",
                    }
                )
        return items

    def _medicine_slots(
        self,
        medicines: list[dict[str, str | None]],
    ) -> dict[str, list[ScheduleItem]]:
        slots: dict[str, list[ScheduleItem]] = {
            "morning": [],
            "afternoon": [],
            "evening": [],
            "night": [],
        }
        for med in medicines:
            freq = (med.get("frequency") or "").lower()
            title = f"Medicine: {med['name']}"
            detail = " · ".join(
                x for x in [med.get("dose"), med.get("frequency"), med.get("instructions")] if x
            )
            item = ScheduleItem(title=title, detail=detail, category="medicine")
            if "thrice" in freq or "three" in freq:
                slots["morning"].append(item)
                slots["afternoon"].append(item)
                slots["evening"].append(item)
            elif "twice" in freq or "2" in freq:
                slots["morning"].append(item)
                slots["evening"].append(item)
            elif "night" in freq or "bed" in freq:
                slots["night"].append(item)
            elif "afternoon" in freq:
                slots["afternoon"].append(item)
            else:
                slots["morning"].append(item)
        return slots

    def _build_schedule(
        self,
        payload: CareCompanionRequest,
        medicines: list[dict[str, str | None]],
    ) -> DailySchedule:
        med_slots = self._medicine_slots(medicines)
        diet = payload.diet_advice or "Follow the diet advice written by your doctor."
        exercise = (
            payload.exercise_advice
            or "Do only the activity level approved in your discharge plan."
        )
        restrictions = payload.restrictions or "Follow all restrictions from your doctor."

        morning = [
            *med_slots["morning"],
            ScheduleItem(
                title="Breakfast",
                detail=diet,
                category="meal",
            ),
            ScheduleItem(
                title="Water reminder",
                detail="Drink a full glass of water unless restricted by your doctor.",
                category="hydration",
            ),
            ScheduleItem(
                title="Vitals check",
                detail="Record BP / sugar / symptoms if your care plan asks for them.",
                category="monitoring",
            ),
        ]
        afternoon = [
            *med_slots["afternoon"],
            ScheduleItem(
                title="Light activity",
                detail=exercise,
                category="activity",
            ),
            ScheduleItem(
                title="Hydration",
                detail="Continue sipping water through the afternoon.",
                category="hydration",
            ),
        ]
        evening = [
            *med_slots["evening"],
            ScheduleItem(
                title="Dinner",
                detail=diet,
                category="meal",
            ),
            ScheduleItem(
                title="Review restrictions",
                detail=restrictions,
                category="monitoring",
            ),
        ]
        night = [
            *med_slots["night"],
            ScheduleItem(
                title="Sleep routine",
                detail="Aim for restful sleep; avoid late heavy meals if advised.",
                category="rest",
            ),
        ]
        return DailySchedule(
            morning=morning,
            afternoon=afternoon,
            evening=evening,
            night=night,
        )

    def _patient_explanation(
        self,
        payload: CareCompanionRequest,
        medicines: list[dict[str, str | None]],
    ) -> str:
        name = payload.patient_name or "You"
        verb = "are" if name.lower() == "you" else "is"
        diagnosis = payload.diagnosis or "your recent hospital care"
        med_count = len(medicines)
        follow = (
            f" Your follow-up is planned for {payload.follow_up_date}."
            if payload.follow_up_date
            else ""
        )
        notes = f" Doctor note: {payload.doctor_notes}." if payload.doctor_notes else ""
        return (
            f"{name} {verb} recovering after care related to {diagnosis}. "
            f"This plan organizes your doctor's advice into a simple daily schedule "
            f"with {med_count} medicine item(s) listed exactly as written by your clinician."
            f"{follow}{notes} "
            "The AI Care Companion does not diagnose or change prescriptions — "
            "it only helps you follow the plan."
        )

    def _caregiver_instructions(
        self,
        payload: CareCompanionRequest,
        medicines: list[dict[str, str | None]],
    ) -> str:
        return (
            "Help the patient take medicines on the written schedule, keep a simple "
            "vitals/symptom log, support meals and hydration, and escort them for "
            f"follow-up{' on ' + payload.follow_up_date if payload.follow_up_date else ''}. "
            f"There are {len(medicines)} medicine line(s) from the doctor — do not add new medicines. "
            "Escalate urgently for chest pain, severe breathlessness, confusion, "
            "uncontrolled vomiting, fainting, or sudden worsening."
        )

    def _warning_signs(self, payload: CareCompanionRequest) -> list[str]:
        base = [
            "Chest pain or pressure",
            "Severe shortness of breath",
            "Confusion, fainting, or inability to wake normally",
            "Uncontrolled vomiting or inability to keep medicines down",
            "Sudden swelling, bleeding, or rapidly worsening pain",
            "Very high fever or blood sugar readings far outside the doctor's range",
        ]
        if payload.special_instructions:
            base.append(f"Also watch for: {payload.special_instructions}")
        return base

    def _next_steps(self, payload: CareCompanionRequest) -> list[str]:
        steps = [
            "Follow today's schedule for medicines, meals, hydration, and activity",
            "Complete daily health check-ins in HealNexus",
            "Do not change medicines without speaking to your doctor",
        ]
        if payload.follow_up_date:
            steps.append(f"Attend follow-up on {payload.follow_up_date}")
        else:
            steps.append("Confirm your next clinic appointment with the care team")
        if payload.hospital_name:
            steps.append(f"Keep discharge papers from {payload.hospital_name} handy")
        return steps

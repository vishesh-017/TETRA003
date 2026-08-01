"""Localized patient education — assistive content in en / hi / gu."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.core.logging import get_logger
from app.schemas.common import AiMeta
from app.schemas.education import EducationRequest, EducationResponse

logger = get_logger(__name__)

_CONTENT_PATH = Path(__file__).resolve().parents[1] / "data" / "education_content.json"


@lru_cache
def _load_content() -> dict:
    with _CONTENT_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


class EducationService:
    module_name = "education"

    def generate(self, payload: EducationRequest) -> EducationResponse:
        logger.info("Education topic=%s locale=%s", payload.topic, payload.locale)
        catalog = _load_content()
        block = catalog[payload.topic][payload.locale]
        content = str(block["content"])
        if payload.condition_context:
            content = (
                f"{content} Context shared for education: "
                f"{payload.condition_context[:160]}."
            )

        return EducationResponse(
            topic=payload.topic,
            locale=payload.locale,
            title=str(block["title"]),
            content=content,
            bullet_points=[str(b) for b in block["bullets"]],
            reminder=str(block["reminder"]),
            meta=AiMeta(
                module=self.module_name,
                provider="localized_content_pack_v1",
                model_hint="curated_i18n; exa_enrichment_optional",
            ),
        )

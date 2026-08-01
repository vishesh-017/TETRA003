"""Government scheme guidance via Exa + curated PM-JAY facts. Not a claims API."""

from __future__ import annotations

from app.core.constants import CLINICAL_DISCLAIMER, TRUSTED_MEDICAL_DOMAINS
from app.core.errors import ProviderUnavailableError
from app.core.logging import get_logger
from app.providers.base import KnowledgeProvider
from app.providers.factory import get_fallback_knowledge_provider
from app.schemas.common import AiMeta
from app.schemas.government import (
    GovernmentGuidanceRequest,
    GovernmentGuidanceResponse,
)

logger = get_logger(__name__)

CURATED = {
    "pmjay": {
        "title": "Ayushman Bharat PM-JAY (overview)",
        "summary": (
            "PM-JAY is India's public health assurance scheme that can cover "
            "eligible families for secondary and tertiary hospitalization at "
            "empaneled hospitals. Eligibility and benefits must be verified "
            "through official PM-JAY / NHA channels."
        ),
        "benefits": [
            "Hospitalization cover for eligible beneficiary families (verify current limits officially)",
            "Cashless treatment at empaneled hospitals when eligibility is confirmed",
            "Coverage focused on secondary and tertiary care packages defined by the scheme",
        ],
        "documents": [
            "Aadhaar or accepted identity proof",
            "Ration card / SECC-linked proof where applicable",
            "Ayushman card if already issued",
            "Hospital admission documents as requested by the empaneled facility",
        ],
        "hospital_tips": [
            "Ask whether the hospital is PM-JAY empaneled before admission",
            "Carry identity documents and any Ayushman card details",
            "Confirm package coverage with the hospital help desk — HealNexus does not process claims",
        ],
        "links": [
            {"label": "PM-JAY official", "url": "https://pmjay.gov.in/"},
            {"label": "National Health Authority", "url": "https://nha.gov.in/"},
        ],
        "steps": [
            "Check family eligibility on official PM-JAY portals or helpline",
            "Confirm nearby empaneled hospitals",
            "Carry required IDs at admission",
            "Ask the hospital PM-JAY desk to verify package coverage",
        ],
    }
}


class GovernmentGuidanceService:
    module_name = "government_guidance"

    def __init__(self, knowledge: KnowledgeProvider) -> None:
        self._knowledge = knowledge
        self._fallback = get_fallback_knowledge_provider()

    async def guide(
        self,
        payload: GovernmentGuidanceRequest,
    ) -> GovernmentGuidanceResponse:
        base = CURATED["pmjay"]
        provider_name = "curated_pmjay_v1"
        enrich_bits: list[str] = []

        query = payload.question or (
            f"Ayushman Bharat PM-JAY {payload.topic} benefits documents "
            f"empaneled hospitals {payload.city_hint or ''}"
        )
        domains = [d for d in TRUSTED_MEDICAL_DOMAINS if d.endswith(".gov.in")] or [
            "pmjay.gov.in",
            "nha.gov.in",
            "mohfw.gov.in",
        ]

        try:
            bundle = await self._knowledge.search(
                query,
                num_results=4,
                include_domains=domains,
            )
            provider_name = bundle.provider
            enrich_bits = [h.snippet[:220] for h in bundle.hits if h.snippet][:3]
        except ProviderUnavailableError:
            logger.warning("Exa unavailable for government guidance; curated only")
            bundle = await self._fallback.search(query, num_results=2)
            provider_name = bundle.provider
            enrich_bits = [h.snippet[:220] for h in bundle.hits if h.snippet][:2]

        summary = base["summary"]
        if enrich_bits:
            summary = (
                f"{summary} Additional retrieved notes: "
                + " ".join(enrich_bits)
            )[:900]

        links = list(base["links"])
        # Prefer official URLs from retrieval when present
        if "bundle" in locals():
            for hit in bundle.hits:
                if hit.url and "gov.in" in hit.url:
                    links.append({"label": hit.title[:80], "url": hit.url})

        # de-dupe links
        seen: set[str] = set()
        unique_links: list[dict[str, str]] = []
        for link in links:
            if link["url"] in seen:
                continue
            seen.add(link["url"])
            unique_links.append(link)

        return GovernmentGuidanceResponse(
            title=str(base["title"]),
            summary=summary,
            benefits=list(base["benefits"]),  # type: ignore[arg-type]
            documents=list(base["documents"]),  # type: ignore[arg-type]
            hospital_tips=list(base["hospital_tips"]),  # type: ignore[arg-type]
            official_links=unique_links[:6],
            simple_steps=list(base["steps"]),  # type: ignore[arg-type]
            disclaimer=(
                f"{CLINICAL_DISCLAIMER} Government guidance here is educational "
                "and may change; verify on official portals before acting."
            ),
            meta=AiMeta(
                module=self.module_name,
                provider=provider_name,
                model_hint="curated+exa_gov_v1",
            ),
        )

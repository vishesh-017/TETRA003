"""Deterministic curated knowledge when Exa is unavailable."""

from app.providers.base import KnowledgeBundle, KnowledgeHit, KnowledgeProvider


class FallbackKnowledgeProvider(KnowledgeProvider):
    name = "curated_fallback"

    async def search(
        self,
        query: str,
        *,
        num_results: int = 5,
        include_domains: list[str] | None = None,
    ) -> KnowledgeBundle:
        q = query.lower()
        hits: list[KnowledgeHit] = []

        if any(k in q for k in ("pm-jay", "pmjay", "ayushman", "abha")):
            hits = [
                KnowledgeHit(
                    title="Ayushman Bharat PM-JAY (official overview)",
                    url="https://pmjay.gov.in/",
                    snippet=(
                        "PM-JAY provides health cover for eligible families for "
                        "secondary and tertiary hospitalization. Always verify "
                        "eligibility and empaneled hospitals through official channels."
                    ),
                    source="curated",
                ),
                KnowledgeHit(
                    title="National Health Authority",
                    url="https://nha.gov.in/",
                    snippet=(
                        "Use official NHA / PM-JAY portals for cards, benefits, "
                        "and hospital lists. This assistant does not process claims."
                    ),
                    source="curated",
                ),
            ]
        elif any(k in q for k in ("medicine", "adherence", "dose")):
            hits = [
                KnowledgeHit(
                    title="Medicine adherence basics",
                    url="https://medlineplus.gov/",
                    snippet=(
                        "Take medicines exactly as your doctor prescribed. "
                        "Do not start, stop, or change doses without clinical advice."
                    ),
                    source="curated",
                )
            ]
        else:
            hits = [
                KnowledgeHit(
                    title="General recovery guidance",
                    url="https://www.who.int/",
                    snippet=(
                        "Rest, hydrate, follow your discharge plan, and contact "
                        "your clinician for warning signs such as severe pain, "
                        "breathing difficulty, chest pain, confusion, or uncontrolled fever."
                    ),
                    source="curated",
                )
            ]

        return KnowledgeBundle(
            query=query,
            hits=hits[:num_results],
            provider=self.name,
        )

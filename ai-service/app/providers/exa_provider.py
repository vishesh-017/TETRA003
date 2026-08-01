from typing import Any

import httpx

from app.core.config import Settings
from app.core.errors import ProviderUnavailableError
from app.core.logging import get_logger
from app.providers.base import KnowledgeBundle, KnowledgeHit, KnowledgeProvider

logger = get_logger(__name__)


class ExaKnowledgeProvider(KnowledgeProvider):
    name = "exa"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._client = httpx.AsyncClient(
            base_url=settings.exa_base_url.rstrip("/"),
            timeout=settings.exa_timeout_seconds,
            headers={
                "x-api-key": settings.exa_api_key,
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    async def search(
        self,
        query: str,
        *,
        num_results: int = 5,
        include_domains: list[str] | None = None,
    ) -> KnowledgeBundle:
        if not self._settings.exa_configured:
            raise ProviderUnavailableError(
                "exa",
                "EXA_API_KEY is not configured on the AI service.",
            )

        payload: dict[str, Any] = {
            "query": query,
            "type": "auto",
            "numResults": num_results,
            "contents": {
                "text": {"maxCharacters": 800},
                "highlights": {"maxCharacters": 400},
            },
        }
        if include_domains:
            payload["includeDomains"] = include_domains

        try:
            response = await self._client.post("/search", json=payload)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(
                "Exa HTTP error %s: %s",
                exc.response.status_code,
                exc.response.text[:300],
            )
            raise ProviderUnavailableError(
                "exa",
                f"Exa search failed with status {exc.response.status_code}.",
            ) from exc
        except httpx.HTTPError as exc:
            logger.error("Exa network error: %s", exc)
            raise ProviderUnavailableError(
                "exa",
                "Unable to reach Exa knowledge provider.",
            ) from exc

        hits: list[KnowledgeHit] = []
        for item in data.get("results", []) or []:
            text = ""
            contents = item.get("text") or ""
            highlights = item.get("highlights") or []
            if highlights:
                text = " ".join(str(h) for h in highlights if h)
            elif contents:
                text = str(contents)
            hits.append(
                KnowledgeHit(
                    title=str(item.get("title") or "Untitled"),
                    url=str(item.get("url") or ""),
                    snippet=text[:600],
                    source="exa",
                )
            )

        logger.info("Exa search ok query=%r hits=%s", query[:80], len(hits))
        return KnowledgeBundle(
            query=query,
            hits=hits,
            provider=self.name,
            raw={"result_count": len(hits)},
        )

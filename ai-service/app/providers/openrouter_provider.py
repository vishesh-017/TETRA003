"""OpenRouter chat completions — assistive LLM only. Never diagnoses/prescribes."""

from __future__ import annotations

from typing import Any

import httpx

from app.core.config import Settings, get_settings
from app.core.errors import ProviderUnavailableError
from app.core.logging import get_logger

logger = get_logger(__name__)

SYSTEM_GUARDRAILS = (
    "You are HealNexus AI Care Companion assistive text helper. "
    "You organize education and recovery guidance for post-discharge care. "
    "Never diagnose. Never prescribe medicines or dosages. "
    "Never invent medicines not already provided by a clinician. "
    "Always remind that doctors make final decisions. "
    "Prefer clear, calm, short sentences for patients and caregivers in India. "
    "If unsure, say to contact the doctor or emergency services."
)


class OpenRouterLLM:
    name = "openrouter"

    def __init__(self, settings: Settings | None = None) -> None:
        self._settings = settings or get_settings()
        self._client = httpx.AsyncClient(
            base_url=self._settings.openrouter_base_url.rstrip("/"),
            timeout=self._settings.openrouter_timeout_seconds,
            headers={
                "Authorization": f"Bearer {self._settings.openrouter_api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": self._settings.openrouter_site_url,
                "X-Title": self._settings.openrouter_app_name,
            },
        )

    async def aclose(self) -> None:
        await self._client.aclose()

    @property
    def configured(self) -> bool:
        return self._settings.openrouter_configured

    @property
    def model(self) -> str:
        return self._settings.openrouter_model

    async def complete(
        self,
        user_prompt: str,
        *,
        system: str | None = None,
        temperature: float = 0.3,
        max_tokens: int = 700,
    ) -> str:
        if not self.configured:
            raise ProviderUnavailableError(
                "openrouter",
                "OPENROUTER_API_KEY is not configured on the AI service.",
            )

        payload: dict[str, Any] = {
            "model": self._settings.openrouter_model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "messages": [
                {"role": "system", "content": system or SYSTEM_GUARDRAILS},
                {"role": "user", "content": user_prompt},
            ],
        }

        try:
            response = await self._client.post("/chat/completions", json=payload)
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as exc:
            logger.error(
                "OpenRouter HTTP error %s: %s",
                exc.response.status_code,
                exc.response.text[:400],
            )
            raise ProviderUnavailableError(
                "openrouter",
                f"OpenRouter failed with status {exc.response.status_code}.",
            ) from exc
        except httpx.HTTPError as exc:
            logger.error("OpenRouter network error: %s", exc)
            raise ProviderUnavailableError(
                "openrouter",
                "Unable to reach OpenRouter.",
            ) from exc

        try:
            content = data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as exc:
            raise ProviderUnavailableError(
                "openrouter",
                "OpenRouter returned an unexpected response shape.",
            ) from exc

        text = str(content or "").strip()
        if not text:
            raise ProviderUnavailableError(
                "openrouter",
                "OpenRouter returned an empty completion.",
            )

        logger.info(
            "OpenRouter ok model=%s chars=%s",
            self._settings.openrouter_model,
            len(text),
        )
        return text

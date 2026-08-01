"""
Future ML integration hooks.

Existing AI HTTP contracts under `/ai/*` must remain stable.
Swap rule/Exa providers for model inference behind service interfaces
(e.g. deterioration prediction) without changing request/response schemas.
"""

from typing import Protocol


class DeteriorationPredictor(Protocol):
    async def predict(self, features: dict) -> dict:
        """Return risk scores — assistive only, never a diagnosis."""
        ...


class NullDeteriorationPredictor:
    async def predict(self, features: dict) -> dict:
        return {
            "status": "not_configured",
            "message": "Set ML_INFERENCE_URL and implement provider adapter.",
            "features_received": list(features.keys()),
            "assistive": True,
        }

from functools import lru_cache

from app.core.config import Settings, get_settings
from app.providers.base import KnowledgeProvider
from app.providers.exa_provider import ExaKnowledgeProvider
from app.providers.fallback_provider import FallbackKnowledgeProvider


@lru_cache
def get_primary_knowledge_provider() -> KnowledgeProvider:
    settings = get_settings()
    if settings.exa_configured:
        return ExaKnowledgeProvider(settings)
    return FallbackKnowledgeProvider()


def get_fallback_knowledge_provider() -> KnowledgeProvider:
    return FallbackKnowledgeProvider()


def build_knowledge_provider(settings: Settings | None = None) -> KnowledgeProvider:
    cfg = settings or get_settings()
    if cfg.exa_configured:
        return ExaKnowledgeProvider(cfg)
    return FallbackKnowledgeProvider()

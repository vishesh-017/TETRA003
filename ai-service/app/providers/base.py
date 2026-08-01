from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass(slots=True)
class KnowledgeHit:
    title: str
    url: str
    snippet: str
    source: str = "unknown"


@dataclass(slots=True)
class KnowledgeBundle:
    query: str
    hits: list[KnowledgeHit] = field(default_factory=list)
    provider: str = "none"
    raw: dict[str, Any] = field(default_factory=dict)


class KnowledgeProvider(ABC):
    """Provider-independent knowledge retrieval interface (Exa today, others later)."""

    name: str

    @abstractmethod
    async def search(
        self,
        query: str,
        *,
        num_results: int = 5,
        include_domains: list[str] | None = None,
    ) -> KnowledgeBundle:
        raise NotImplementedError

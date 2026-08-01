from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "HealNexus AI Service"
    app_env: str = "development"
    debug: bool = False
    host: str = "127.0.0.1"
    port: int = 8001

    # Include your Vercel URL(s) in production, e.g.
    # https://your-app.vercel.app,http://localhost:5173
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "https://vishesh-017s-projects.vercel.app"
    )

    exa_api_key: str = ""
    exa_base_url: str = "https://api.exa.ai"
    exa_timeout_seconds: float = 20.0

    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_model: str = "openai/gpt-4o-mini"
    openrouter_timeout_seconds: float = 45.0
    openrouter_site_url: str = "http://127.0.0.1:5173"
    openrouter_app_name: str = "HealNexus"

    supabase_url: str = ""
    supabase_service_role_key: str = ""

    ml_inference_url: str = ""
    log_level: str = "INFO"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def exa_configured(self) -> bool:
        return bool(self.exa_api_key.strip())

    @property
    def openrouter_configured(self) -> bool:
        return bool(self.openrouter_api_key.strip())

    @property
    def supabase_configured(self) -> bool:
        return bool(self.supabase_url and self.supabase_service_role_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()

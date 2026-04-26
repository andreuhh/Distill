"""Centralized configuration, loaded from environment variables / .env."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    openai_api_key: str = ""  # only used by the Whisper fallback (optional)
    enable_whisper_fallback: bool = True
    preferred_languages: str = "it,en"
    cors_origins: str = "http://localhost:5173"
    cache_ttl_days: int = 7  # 0 = no expiration

    @property
    def preferred_languages_list(self) -> list[str]:
        return [x.strip() for x in self.preferred_languages.split(",") if x.strip()]

    @property
    def cors_origins_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]


# Singleton instance — import it from other modules
settings = Settings()  # type: ignore[call-arg]

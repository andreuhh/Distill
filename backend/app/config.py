"""Configurazione centralizzata, caricata da variabili d'ambiente / .env"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    openai_api_key: str = ""  # usato solo dal fallback Whisper (opzionale)
    enable_whisper_fallback: bool = True
    preferred_languages: str = "it,en"
    cors_origins: str = "http://localhost:5173"
    cache_ttl_days: int = 7  # 0 = nessuna scadenza

    @property
    def preferred_languages_list(self) -> list[str]:
        return [x.strip() for x in self.preferred_languages.split(",") if x.strip()]

    @property
    def cors_origins_list(self) -> list[str]:
        return [x.strip() for x in self.cors_origins.split(",") if x.strip()]


# Instance-singleton — importalo dagli altri moduli
settings = Settings()  # type: ignore[call-arg]

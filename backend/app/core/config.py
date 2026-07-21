import os
from typing import Optional
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        # Ignore any extra env vars that are not declared as fields.
        # This is critical: Railway injects many env vars (e.g. REDIS_URL,
        # RAILWAY_*, PORT) that pydantic-settings v2 would otherwise reject
        # with a ValidationError because its default is extra="forbid".
        extra="ignore",
    )

    PROJECT_NAME: str = "NETHRA AI"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@postgres:5432/nethra_ai"
    UPLOAD_DIR: str = "uploads"

    # Railway provides a single REDIS_URL variable for its managed Redis addon.
    # Declare it here so pydantic accepts it without raising an extra-field error.
    REDIS_URL: Optional[str] = None

    # Celery / Redis
    # These can be set independently, or derived from REDIS_URL via the validator below.
    CELERY_BROKER_URL: Optional[str] = None
    CELERY_RESULT_BACKEND: Optional[str] = None

    @model_validator(mode="after")
    def _resolve_celery_urls(self) -> "Settings":
        """
        Populate CELERY_BROKER_URL and CELERY_RESULT_BACKEND from REDIS_URL
        when they are not set explicitly.  Priority order:
          1. CELERY_BROKER_URL / CELERY_RESULT_BACKEND env vars (explicit override)
          2. REDIS_URL env var (Railway managed Redis addon)
          3. localhost fallback (local development without Redis)
        """
        fallback = self.REDIS_URL or "redis://localhost:6379/0"
        if not self.CELERY_BROKER_URL:
            self.CELERY_BROKER_URL = fallback
        if not self.CELERY_RESULT_BACKEND:
            self.CELERY_RESULT_BACKEND = fallback
        return self

    # OCR Settings
    TESSERACT_CMD: str = "tesseract"
    # Processing pipeline version – increment when extraction engines are upgraded
    PROCESSING_VERSION: str = "v1.0"

    # Threat Intelligence API Keys
    VIRUSTOTAL_API_KEY: Optional[str] = None
    ABUSEIPDB_API_KEY: Optional[str] = None
    HIBP_API_KEY: Optional[str] = None
    WHOIS_API_KEY: Optional[str] = None
    GEOIP_API_KEY: Optional[str] = None          # MaxMind licence key (GeoIP2 API / GeoLite2 download)
    MAXMIND_ACCOUNT_ID: Optional[str] = None     # MaxMind account ID (required for web-service API)
    GEOIP_DB_PATH: Optional[str] = None          # Absolute path to GeoLite2-City.mmdb (optional local DB)
    BLOCKCHAIN_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None


settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)


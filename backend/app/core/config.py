import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NETHRA AI"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@postgres:5432/nethra_ai"
    UPLOAD_DIR: str = "uploads"

    # Celery / Redis
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # OCR Settings
    TESSERACT_CMD: str = "tesseract"
    # Processing pipeline version – increment when extraction engines are upgraded
    PROCESSING_VERSION: str = "v1.0"

    # Threat Intelligence API Keys
    VIRUSTOTAL_API_KEY: str | None = None
    ABUSEIPDB_API_KEY: str | None = None
    HIBP_API_KEY: str | None = None
    WHOIS_API_KEY: str | None = None
    GEOIP_API_KEY: str | None = None          # MaxMind licence key (GeoIP2 API / GeoLite2 download)
    MAXMIND_ACCOUNT_ID: str | None = None     # MaxMind account ID (required for web-service API)
    GEOIP_DB_PATH: str | None = None          # Absolute path to GeoLite2-City.mmdb (optional local DB)
    BLOCKCHAIN_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

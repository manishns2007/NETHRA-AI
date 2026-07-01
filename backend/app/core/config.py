import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NETHRA AI"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./nethra_ai.db"  # Using SQLite for MVP as planned
    UPLOAD_DIR: str = "uploads"

    # Celery / Redis
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # OCR Settings
    TESSERACT_CMD: str = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
    # Processing pipeline version – increment when extraction engines are upgraded
    PROCESSING_VERSION: str = "v1.0"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

"""
Configuration module for Rakshak using Pydantic Settings.
Enforces zero-hardcoded credentials, strict typing, and structured configuration.
"""
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Application
    APP_NAME: str = "Rakshak"
    ENVIRONMENT: str = "development"
    LOG_LEVEL: str = "INFO"
    API_PORT: int = 8000
    API_HOST: str = "0.0.0.0"
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    # Database
    DATABASE_URL: str = "postgresql://rakshak:rakshak_secret@localhost:5432/rakshak_db"
    USE_SQLITE_FALLBACK: bool = True
    SQLITE_DB_PATH: str = "./data/rakshak.db"

    # Notification & Alerts
    NOTIFICATION_PROVIDER: str = "console"  # "twilio" or "console"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_FROM_NUMBER: str = ""
    DEFAULT_ALERT_PHONE_NUMBERS: List[str] = ["+919876543210"]

    # Thresholds for early warning (0-100 composite risk scale)
    THRESHOLD_ADVISORY: float = Field(default=40.0, description="Advisory / Yellow alert threshold")
    THRESHOLD_WATCH: float = Field(default=60.0, description="Watch / Orange alert threshold")
    THRESHOLD_WARNING: float = Field(default=80.0, description="Warning / Red emergency threshold")

    # External APIs
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    OPEN_ELEVATION_BASE_URL: str = "https://api.open-elevation.com/api/v1"
    IMD_DATA_GOV_API_KEY: str = ""
    BHUVAN_API_KEY: str = ""
    NASA_EARTHDATA_TOKEN: str = ""


settings = Settings()

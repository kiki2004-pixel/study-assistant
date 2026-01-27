from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # App General Settings
    APP_NAME: str = "Mail Validation Service"
    DEBUG: bool = False

    # Listmonk Integration
    listmonk_url: str = "http://localhost:9000"
    listmonk_user: str = ""
    listmonk_pass: str = ""
    listmonk_list_id: str = ""
    listmonk_exclude_name_substrings: str = ""

    # Worker / Celery Settings
    celery_broker_url: str = "redis://localhost:6379/0"
    celery_result_backend: str = "redis://localhost:6379/0"
    watermark_db_url: str = "sqlite:///./watermarks.db"
    validation_batch_size: int = 250

    # Use the 2026 model_config style
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache()
def get_settings() -> Settings:
    """
    Uses lru_cache to ensure we only load the .env file once,
    improving performance for the 30,000 monthly checks.
    """
    return Settings()


# Standard instance for easy access
settings = get_settings()

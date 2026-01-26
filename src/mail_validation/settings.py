from functools import lru_cache
from typing import Optional

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    listmonk_url: str = Field(
        default="http://localhost:9000",
        validation_alias=AliasChoices("LISTMONK_BASE_URL", "LISTMONK_URL"),
    )
    listmonk_user: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("LISTMONK_USERNAME", "LISTMONK_USER"),
    )
    listmonk_pass: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("LISTMONK_PASSWORD", "LISTMONK_PASS"),
    )
    listmonk_api_user: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("LISTMONK_API_USER"),
    )
    listmonk_api_token: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("LISTMONK_API_TOKEN"),
    )
    listmonk_list_id: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("LISTMONK_LIST_ID"),
    )
    listmonk_exclude_name_substrings: str = Field(
        default="test,sample",
        validation_alias=AliasChoices("LISTMONK_EXCLUDE_NAME_SUBSTRINGS"),
    )
    watermark_db_url: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("WATERMARK_DB_URL"),
    )
    validation_batch_size: int = Field(
        default=250,
        validation_alias=AliasChoices("VALIDATION_BATCH_SIZE"),
    )
    validation_poll_interval_seconds: int = Field(
        default=0,
        validation_alias=AliasChoices("VALIDATION_POLL_INTERVAL_SECONDS"),
    )
    celery_broker_url: str = Field(
        default="redis://localhost:6379/0",
        validation_alias=AliasChoices("CELERY_BROKER_URL"),
    )
    celery_result_backend: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("CELERY_RESULT_BACKEND"),
    )
    celery_restart_delay_seconds: int = Field(
        default=10,
        validation_alias=AliasChoices("CELERY_RESTART_DELAY_SECONDS"),
    )
    postmark_webhook_secret: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("POSTMARK_WEBHOOK_SECRET"),
    )

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()

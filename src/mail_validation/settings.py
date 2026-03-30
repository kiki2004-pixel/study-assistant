from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
import ipaddress
import socket
from fastapi import HTTPException
from pydantic import HttpUrl


class Settings(BaseSettings):
    # App General Settings
    APP_NAME: str = "Mail Validation Service"
    DEBUG: bool = False

    # API Key
    api_key: str = ""

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


def block_ssrf(url: HttpUrl) -> None:
    """
    Rejects URLs resolving to private/internal IPs to prevent SSRF.
    Import this wherever user-supplied URLs are used to make outbound requests.
    """
    try:
        ip = ipaddress.ip_address(socket.gethostbyname(url.host))
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise HTTPException(
                status_code=400,
                detail="URL resolves to a private or reserved IP address.",
            )
    except socket.gaierror:
        raise HTTPException(
            status_code=400,
            detail=f"Could not resolve host: {url.host}",
        )
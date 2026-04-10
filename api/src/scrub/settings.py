import ipaddress
import socket
from functools import lru_cache

from fastapi import HTTPException
from pydantic import HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App General Settings
    APP_NAME: str = "Scrub"
    DEBUG: bool = False

    # API Key
    api_key: str = ""

    # Zitadel Auth
    zitadel_domain: str = "http://localhost:8080"

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
    Rejects URLs where ANY resolved IP (IPv4 or IPv6) is private/internal.
    Uses getaddrinfo to resolve all A and AAAA records — prevents bypass via
    hostnames that return a public IP first and a private IP second.
    """
    try:
        addrinfos = socket.getaddrinfo(url.host, None, type=socket.SOCK_STREAM)
    except socket.gaierror:
        raise HTTPException(
            status_code=400,
            detail=f"Could not resolve host: {url.host}",
        )
    for _family, _type, _proto, _canonname, sockaddr in addrinfos:
        ip_str = sockaddr[0]
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            continue
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise HTTPException(
                status_code=400,
                detail="URL resolves to a private or reserved IP address.",
            )
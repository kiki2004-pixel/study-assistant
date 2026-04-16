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

    # CORS — comma-separated list of allowed origins
    cors_allowed_origins: str = "http://localhost:5173"

    # Zitadel Auth
    zitadel_domain: str = "http://localhost:8080"
    zitadel_jwks_url: str = "http://localhost:8080/oauth/v2/keys"
    zitadel_client_id: str = ""

    # Postmark webhook
    postmark_webhook_secret: str = ""

    # Sentry
    sentry_dsn: str = ""
    sentry_environment: str = "local"

    # Worker / Redis Settings
    redis_url: str = "redis://localhost:6379/0"
    scrub_db_url: str
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

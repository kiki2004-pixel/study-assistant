from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    listmonk_url: str = "http://localhost:9000"
    listmonk_user: Optional[str] = None
    listmonk_pass: Optional[str] = None

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

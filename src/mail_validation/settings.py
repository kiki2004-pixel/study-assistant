from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    listmonk_url: str = "http://localhost:9000"
    listmonk_user: str
    listmonk_pass: str

    # This is the value you must use in your Postmark header
    postmark_webhook_secret: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Added defaults to all fields to prevent startup crashes
    listmonk_url: str = "http://localhost:9000"
    listmonk_user: str = "admin"
    listmonk_pass: str = "password"
    mails_so_api_key: str = "placeholder_key"
    
    # This is the value you must use in your Postmark header
    postmark_webhook_secret: str = "test_secret"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

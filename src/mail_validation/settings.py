from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Adding default values prevents a 500 crash when .env is empty
    listmonk_url: str = "http://localhost:9000"
    listmonk_user: str = "admin"
    listmonk_pass: str = "password"
    mails_so_api_key: str = "placeholder_key"
    postmark_webhook_secret: str = "placeholder_secret"

    # extra="ignore" allows the app to ignore extra variables in the .env
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

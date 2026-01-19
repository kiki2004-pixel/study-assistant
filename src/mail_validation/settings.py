from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Adding default values prevents a 500 crash when .env is empty
    listmonk_url: str
    listmonk_user: str
    listmonk_pass: str
    mails_so_api_key: str
    postmark_webhook_secret: str

    # extra="ignore" allows the app to ignore extra variables in the .env
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

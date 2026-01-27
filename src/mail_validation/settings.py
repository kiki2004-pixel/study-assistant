from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Your existing settings fields...
    APP_NAME: str = "Mail Validation Service"
    DEBUG: bool = False
    
    class Config:
        env_file = ".env"

# Create settings instance
_settings = Settings()

def get_settings():
    """
    Returns the settings instance. Logic that requires the validator 
    must import it locally inside the function to avoid circular imports.
    """
    return _settings

def some_config_validation_logic(email: str):
    """
    Example of a function in settings that needs validation.
    We move the import INSIDE this function.
    """
    # FIX: Lazy import breaks the circular dependency loop
    from mail_validation.services.validation_service import validate_email_internal
    
    return validate_email_internal(email)

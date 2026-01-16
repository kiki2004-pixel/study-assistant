from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

class ValidationRequest(BaseModel):
    """The data we expect from a user/system to validate an email."""
    email: EmailStr

class ValidationResponse(BaseModel):
    """The structured response our API returns to the user."""
    email: str
    action: str  # e.g., "blacklisted" or "none"
    status: str  # e.g., "deliverable", "undeliverable", "risky"
    reason: Optional[str] = None
    details: Dict[str, Any]  # Stores the raw responses from Mails.so and Listmonk

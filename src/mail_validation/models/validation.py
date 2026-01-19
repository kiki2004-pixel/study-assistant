from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

class ValidationResponse(BaseModel):
    """The structured response our API returns to the user."""
    email: EmailStr
    status: str  # e.g., "deliverable", "undeliverable", "risky"
    reason: Optional[str] = None
    details: Dict[str, Any]  # Stores the raw responses from Mails.so and Listmonk

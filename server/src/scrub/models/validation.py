from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any


class ValidationResponse(BaseModel):
    """Structured response returned by the validation API."""

    email: EmailStr
    status: str  # e.g., "deliverable", "undeliverable", "risky"
    reason: Optional[str] = None
    details: Dict[str, Any]

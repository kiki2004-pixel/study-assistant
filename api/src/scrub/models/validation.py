from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any


class ValidationChecks(BaseModel):
    valid_format: bool
    valid_domain: bool
    can_receive_email: bool
    is_disposable: bool
    is_generic: bool


class ValidationAttributes(BaseModel):
    username: str
    domain: str
    is_free: bool
    is_disposable: bool
    is_generic: bool
    provider: Optional[str] = None
    mx_record: Optional[str] = None


class ValidationResponse(BaseModel):
    email: EmailStr
    status: str
    reason: Optional[str] = None
    details: Dict[str, Any]
    checks: ValidationChecks
    attributes: ValidationAttributes
    quality_score: int

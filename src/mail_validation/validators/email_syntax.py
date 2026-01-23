from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from pydantic import EmailStr, TypeAdapter, ValidationError


@dataclass(frozen=True)
class EmailSyntaxResult:
    valid: bool
    reason: Optional[str] = None  
    message: Optional[str] = None  


_EMAIL_ADAPTER = TypeAdapter(EmailStr)

_MAX_EMAIL_LENGTH = 320 


def validate_email_syntax(email: str) -> EmailSyntaxResult:
    """
    Email syntax validation (Layer 1).
    Bulk-safe: no regex bombs, no network calls, bounded checks.
    """

    e = email.strip()
    if e == "":
        return EmailSyntaxResult(False, "empty", "Email is empty.")

    if len(e) > _MAX_EMAIL_LENGTH:
        return EmailSyntaxResult(False, "too_long", "Email exceeds maximum length.")

    # Reject whitespace
    if any(ch.isspace() for ch in email):
        return EmailSyntaxResult(False, "contains_whitespace", "Email contains whitespace.")

    # Must contain exactly one "@"
    at_count = e.count("@")
    if at_count == 0:
        return EmailSyntaxResult(False, "missing_at", "Email must contain '@'.")
    if at_count > 1:
        return EmailSyntaxResult(False, "multiple_at", "Email must contain only one '@'.")

    local, domain = e.split("@", 1)
    if local == "":
        return EmailSyntaxResult(False, "missing_local", "Missing local part before '@'.")
    if domain == "":
        return EmailSyntaxResult(False, "missing_domain", "Missing domain part after '@'.")

    # Practical domain sanity
    if domain.startswith(".") or domain.endswith(".") or ".." in domain:
        return EmailSyntaxResult(False, "invalid_domain", "Domain has invalid dot placement.")

    # Optional business rule (recommended for public email validation):
    if "." not in domain:
        return EmailSyntaxResult(False, "domain_no_dot", "Domain must contain a dot.")

    # Let Pydantic validate overall formatting rules
    try:
        _EMAIL_ADAPTER.validate_python(e)
    except ValidationError as err:
        return EmailSyntaxResult(False, "invalid_format", f"Invalid email format: {err}")

    return EmailSyntaxResult(True)

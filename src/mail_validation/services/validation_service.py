from __future__ import annotations

from typing import Any, Dict

from mail_validation.validators.email_syntax import validate_email_syntax


def validate_email_internal(email: str) -> Dict[str, Any]:
    """
    Internal validation pipeline.
    Returns a dict that the router maps into ValidationResponse.
    """
    syntax = validate_email_syntax(email)
    if not syntax.valid:
        return {
            "ok": False,
            "layer": "syntax",
            "status": "undeliverable",
            "reason": syntax.reason,
            "details": {"message": syntax.message},
        }

    return {
        "ok": True,
        "layer": "syntax",
        "status": "unknown",  # until we implement DNS layer
        "reason": None,
        "details": {},
    }

from __future__ import annotations
from typing import Any, Dict
from mail_validation.validators.email_syntax import validate_email_syntax
from mail_validation.validators.email_mx import validate_email_mx

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

    domain = email.strip().split("@", 1)[1].lower()
    mx = validate_email_mx(domain)
    details: Dict[str, Any] = {}
    if mx.message:
        details["message"] = mx.message
    if mx.records:
        details["mx_records"] = mx.records

    return {
        "ok": mx.ok,
        "layer": "dns_mx",
        "status": mx.status,
        "reason": mx.reason,
        "details": details,

    }

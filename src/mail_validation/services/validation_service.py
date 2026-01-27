from __future__ import annotations
from typing import Any, Dict
from mail_validation.validators.email_syntax import validate_email_syntax
from mail_validation.services.dns_service import check_dns_records

async def validate_email_internal(email: str) -> Dict[str, Any]:
    """
    Internal validation pipeline (Async).
    1. Checks syntax via internal validator.
    2. Performs async DNS lookup (MX/A records).
    """
    # 1. Syntax Layer
    syntax = validate_email_syntax(email)
    if not syntax.valid:
        return {
            "ok": False,
            "layer": "syntax",
            "status": "undeliverable",
            "reason": syntax.reason,
            "details": {"message": syntax.message},
        }

    # 2. DNS Layer (Now Async)
    # Extract domain safely from validated email
    domain = email.strip().split("@")[-1].lower()
    
    # Await the new async DNS service
    dns_result = await check_dns_records(domain)
    
    # Prepare details for the response
    details: Dict[str, Any] = dns_result.get("details", {})
    
    return {
        "ok": dns_result["is_valid"],
        "layer": "dns",
        "status": "deliverable" if dns_result["is_valid"] else "undeliverable",
        "reason": dns_result["reason"],
        "details": details,
    }
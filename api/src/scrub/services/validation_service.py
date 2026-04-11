from __future__ import annotations
from typing import Any, Dict
from scrub.validators.email_syntax import validate_email_syntax
from scrub.services.dns_service import check_dns_records
from scrub.services.enrichment_service import enrich, compute_quality_score


async def validate_email_internal(email: str) -> Dict[str, Any]:
    """
    Internal validation pipeline (Async).
    1. Checks syntax via internal validator.
    2. Performs async DNS lookup (MX/A records).
    3. Enriches with provider, free/disposable/generic detection, quality score.
    """
    # 1. Syntax Layer
    syntax = validate_email_syntax(email)
    if not syntax.valid:
        enriched = enrich(email, None)
        checks = {
            "valid_format": False,
            "valid_domain": False,
            "can_receive_email": False,
            "is_disposable": enriched["is_disposable"],
            "is_generic": enriched["is_generic"],
        }
        return {
            "ok": False,
            "layer": "syntax",
            "status": "undeliverable",
            "reason": syntax.reason,
            "details": {
                "message": syntax.message,
                "mx_found": False,
                "a_found": False,
                "mx_host": None,
            },
            "checks": checks,
            "attributes": enriched,
            "quality_score": 0,
        }

    # 2. DNS Layer
    domain = email.strip().split("@")[-1].lower()
    dns_result = await check_dns_records(domain)
    dns_details: Dict[str, Any] = dns_result.get("details", {})

    mx_host = dns_details.get("mx_host")
    enriched = enrich(email, mx_host)

    checks = {
        "valid_format": True,
        "valid_domain": dns_result["is_valid"],
        "can_receive_email": dns_details.get("mx_found", False),
        "is_disposable": enriched["is_disposable"],
        "is_generic": enriched["is_generic"],
    }

    quality_score = compute_quality_score(
        valid_format=checks["valid_format"],
        valid_domain=checks["valid_domain"],
        can_receive_email=checks["can_receive_email"],
        is_disposable=checks["is_disposable"],
        is_generic=checks["is_generic"],
    )

    status = "deliverable" if dns_result["is_valid"] else "undeliverable"
    if enriched["is_disposable"]:
        status = "risky"

    return {
        "ok": dns_result["is_valid"],
        "layer": "dns",
        "status": status,
        "reason": dns_result["reason"],
        "details": dns_details,
        "checks": checks,
        "attributes": enriched,
        "quality_score": quality_score,
    }

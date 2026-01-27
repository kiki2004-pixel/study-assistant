from __future__ import annotations

from dataclasses import dataclass, field
from functools import lru_cache
from typing import Optional

import dns.exception
import dns.resolver

from mail_validation.settings import get_settings


@dataclass(frozen=True)
class EmailMxResult:
    ok: bool
    status: str
    reason: Optional[str] = None
    message: Optional[str] = None
    records: list[str] = field(default_factory=list)


@lru_cache(maxsize=4096)
def _resolve_mx(domain: str, timeout_seconds: float) -> list[str]:
    resolver = dns.resolver.Resolver()
    resolver.timeout = timeout_seconds
    resolver.lifetime = timeout_seconds

    answers = resolver.resolve(domain, "MX")
    return sorted(str(record.exchange).rstrip(".") for record in answers)


def validate_email_mx(domain: str) -> EmailMxResult:
    """
    DNS MX validation (Layer 2).
    Best-effort: returns unknown on transient DNS errors/timeouts.
    """
    settings = get_settings()
    if not settings.mx_check_enabled:
        return EmailMxResult(
            ok=True,
            status="unknown",
            reason="mx_check_disabled",
            message="MX check disabled.",
        )

    normalized = domain.strip().lower()
    if normalized == "":
        return EmailMxResult(
            ok=False,
            status="undeliverable",
            reason="missing_domain",
            message="Missing domain for MX lookup.",
        )

    try:
        records = _resolve_mx(normalized, settings.mx_timeout_seconds)
    except dns.resolver.NXDOMAIN:
        return EmailMxResult(
            ok=False,
            status="undeliverable",
            reason="domain_not_found",
            message="Domain does not exist.",
        )
    except dns.resolver.NoAnswer:
        return EmailMxResult(
            ok=False,
            status="undeliverable",
            reason="mx_not_found",
            message="No MX records found.",
        )
    except dns.resolver.NoNameservers:
        return EmailMxResult(
            ok=True,
            status="unknown",
            reason="no_nameservers",
            message="No nameservers could be reached.",
        )
    except dns.exception.Timeout:
        return EmailMxResult(
            ok=True,
            status="unknown",
            reason="dns_timeout",
            message="DNS query timed out.",
        )
    except Exception as exc:
        return EmailMxResult(
            ok=True,
            status="unknown",
            reason="dns_error",
            message=f"DNS error: {exc}",
        )

    if not records:
        return EmailMxResult(
            ok=False,
            status="undeliverable",
            reason="mx_not_found",
            message="No MX records found.",
        )

    return EmailMxResult(
        ok=True,
        status="deliverable",
        records=records,
    )

import asyncio
import dns.asyncresolver
from dns.resolver import NoAnswer, NXDOMAIN


def _resolver() -> dns.asyncresolver.Resolver:
    """Return a fresh resolver bound to the running event loop.

    The global dns.asyncresolver.Resolver caches internal state tied to a
    specific event loop. RQ workers spin up a new loop per job, so reusing a
    module-level resolver causes silent hangs. Creating one per-call is cheap.
    """
    r = dns.asyncresolver.Resolver()
    r.timeout = 2.0
    r.lifetime = 2.0
    return r


async def check_dns_records(domain: str) -> dict:
    """Verifies if a domain is capable of receiving mail."""
    details = {"mx_found": False, "a_found": False}
    try:
        await _RESOLVER.resolve(domain, "MX")
        details["mx_found"] = True
        return {"is_valid": True, "reason": "MAIL_SERVER_FOUND", "details": details}
    except (NoAnswer, NXDOMAIN):
        try:
            await asyncio.wait_for(resolver.resolve(domain, "A"), timeout=3.0)
            details["a_found"] = True
            return {
                "is_valid": True,
                "reason": "MAIL_SERVER_FOUND_FALLBACK",
                "details": details,
            }
        except Exception:
            return {
                "is_valid": False,
                "reason": "NO_MAIL_SERVER_CONFIGURED",
                "details": details,
            }
    except (NoAnswer, NXDOMAIN, dns.exception.DNSException):
        # Fail-safe: allow if DNS itself is unreachable to avoid false negatives
        return {"is_valid": True, "reason": "DNS_ERROR_FAIL_SAFE", "details": details}

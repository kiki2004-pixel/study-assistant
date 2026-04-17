import asyncio
import dns.asyncresolver
from dns.resolver import NoAnswer, NXDOMAIN
from dns.exception import Timeout


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
    resolver = _resolver()
    details = {"mx_found": False, "a_found": False, "mx_host": None}
    try:
        answers = await asyncio.wait_for(resolver.resolve(domain, "MX"), timeout=3.0)
        mx_host = str(sorted(answers, key=lambda r: r.preference)[0].exchange).rstrip(
            "."
        )
        details["mx_found"] = True
        details["mx_host"] = mx_host
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
    except (Timeout, asyncio.TimeoutError, dns.exception.DNSException):
        return {"is_valid": True, "reason": "DNS_ERROR_FAIL_SAFE", "details": details}

import dns.asyncresolver
from dns.resolver import NoAnswer, NXDOMAIN
from dns.exception import Timeout

# Reusable resolver for high-performance worker loops
_RESOLVER = dns.asyncresolver.Resolver()
_RESOLVER.timeout = 2.0
_RESOLVER.lifetime = 2.0


async def check_dns_records(domain: str) -> dict:
    """Verifies if a domain is capable of receiving mail."""
    details = {"mx_found": False, "a_found": False, "mx_host": None}
    try:
        answers = await _RESOLVER.resolve(domain, "MX")
        mx_host = str(sorted(answers, key=lambda r: r.preference)[0].exchange).rstrip(
            "."
        )
        details["mx_found"] = True
        details["mx_host"] = mx_host
        return {"is_valid": True, "reason": "MAIL_SERVER_FOUND", "details": details}
    except (NoAnswer, NXDOMAIN):
        try:
            await _RESOLVER.resolve(domain, "A")
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
    except (NoAnswer, NXDOMAIN, Timeout, dns.exception.DNSException):
        return {"is_valid": True, "reason": "DNS_ERROR_FAIL_SAFE", "details": details}

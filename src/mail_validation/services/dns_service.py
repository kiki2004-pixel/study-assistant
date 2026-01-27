import dns.asyncresolver
from dns.resolver import NoAnswer, NXDOMAIN

# Reusable resolver for high-performance worker loops
_RESOLVER = dns.asyncresolver.Resolver()
_RESOLVER.timeout = 2.0
_RESOLVER.lifetime = 2.0

async def check_dns_records(domain: str) -> dict:
    """Verifies if a domain is capable of receiving mail."""
    details = {"mx_found": False, "a_found": False}
    try:
        await _RESOLVER.resolve(domain, 'MX')
        details["mx_found"] = True
        return {"is_valid": True, "reason": "MAIL_SERVER_FOUND", "details": details}
    except (NoAnswer, NXDOMAIN):
        try:
            await _RESOLVER.resolve(domain, 'A')
            details["a_found"] = True
            return {"is_valid": True, "reason": "MAIL_SERVER_FOUND_FALLBACK", "details": details}
        except Exception:
            return {"is_valid": False, "reason": "NO_MAIL_SERVER_CONFIGURED", "details": details}
    except Exception as e:
        # Fail-safe: allow if DNS itself is unreachable to avoid false negatives
        return {"is_valid": True, "reason": "DNS_ERROR_FAIL_SAFE", "details": details}

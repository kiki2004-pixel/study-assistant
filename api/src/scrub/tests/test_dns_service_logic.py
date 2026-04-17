from unittest.mock import AsyncMock, MagicMock, patch

# Core DNS exceptions
from dns.asyncresolver import NoAnswer, NXDOMAIN
from dns.exception import Timeout
from scrub.services.dns_service import check_dns_records

# No @pytest.mark.asyncio needed as asyncio_mode = auto is in pytest.ini


def _mock_resolver(resolve_side_effect):
    """Return a mock resolver whose .resolve() behaves as specified."""
    resolver = MagicMock()
    resolver.resolve = AsyncMock(side_effect=resolve_side_effect)
    return resolver


async def test_mx_record_found():
    """Happy Path: Verifies that a valid MX record returns True."""
    mock_answer = MagicMock()
    mock_answer.preference = 10
    mock_answer.exchange = MagicMock()
    mock_answer.exchange.__str__ = lambda self: "mail.gmail.com."

    resolver = _mock_resolver([[mock_answer]])
    with patch("scrub.services.dns_service._resolver", return_value=resolver):
        result = await check_dns_records("gmail.com")
        assert result["is_valid"] is True
        assert result["reason"] == "MAIL_SERVER_FOUND"


async def test_a_record_fallback_found():
    """Fallback Path: MX missing but A record exists."""
    resolver = _mock_resolver([NoAnswer, [MagicMock()]])
    with patch("scrub.services.dns_service._resolver", return_value=resolver):
        result = await check_dns_records("example.com")
        assert result["is_valid"] is True
        assert result["reason"] == "MAIL_SERVER_FOUND_FALLBACK"


async def test_no_records_found():
    """Sad Path: Neither MX nor A records exist."""
    resolver = _mock_resolver([NXDOMAIN, NXDOMAIN])
    with patch("scrub.services.dns_service._resolver", return_value=resolver):
        result = await check_dns_records("this-is-not-a-real-domain.xyz")
        assert result["is_valid"] is False
        assert result["reason"] == "NO_MAIL_SERVER_CONFIGURED"


async def test_dns_timeout_fails_open():
    """
    Fail-Safe: Service should allow the email if DNS times out.
    FIXED: Matches the actual string 'DNS_ERROR_FAIL_SAFE' in dns_service.py.
    """
    resolver = _mock_resolver(Timeout)
    with patch("scrub.services.dns_service._resolver", return_value=resolver):
        result = await check_dns_records("slow-dns-server.com")
        assert result["is_valid"] is True
        assert result["reason"] == "DNS_ERROR_FAIL_SAFE"

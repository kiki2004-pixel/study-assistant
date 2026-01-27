from unittest.mock import AsyncMock, patch

# Core DNS exceptions
from dns.asyncresolver import NoAnswer, NXDOMAIN
from dns.exception import Timeout
from mail_validation.services.dns_service import check_dns_records, _RESOLVER

# No @pytest.mark.asyncio needed as asyncio_mode = auto is in pytest.ini


async def test_mx_record_found():
    """Happy Path: Verifies that a valid MX record returns True."""
    with patch.object(_RESOLVER, "resolve", new_callable=AsyncMock) as mock_resolve:
        mock_resolve.return_value = [AsyncMock()]
        result = await check_dns_records("gmail.com")
        assert result["is_valid"] is True
        assert result["reason"] == "MAIL_SERVER_FOUND"


async def test_a_record_fallback_found():
    """Fallback Path: MX missing but A record exists."""
    # First call (MX) raises NoAnswer, second call (A) succeeds
    # We use a list with a mock result to simulate a successful A-record resolution
    with patch.object(_RESOLVER, "resolve", side_effect=[NoAnswer, [AsyncMock()]]):
        result = await check_dns_records("example.com")
        assert result["is_valid"] is True
        assert result["reason"] == "MAIL_SERVER_FOUND_FALLBACK"


async def test_no_records_found():
    """Sad Path: Neither MX nor A records exist."""
    with patch.object(_RESOLVER, "resolve", side_effect=[NXDOMAIN, NXDOMAIN]):
        result = await check_dns_records("this-is-not-a-real-domain.xyz")
        assert result["is_valid"] is False
        assert result["reason"] == "NO_MAIL_SERVER_CONFIGURED"


async def test_dns_timeout_fails_open():
    """
    Fail-Safe: Service should allow the email if DNS times out.
    FIXED: Matches the actual string 'DNS_ERROR_FAIL_SAFE' in dns_service.py.
    """
    with patch.object(_RESOLVER, "resolve", side_effect=Timeout):
        result = await check_dns_records("slow-dns-server.com")

        assert result["is_valid"] is True
        # Must match the service code exactly to pass
        assert result["reason"] == "DNS_ERROR_FAIL_SAFE"

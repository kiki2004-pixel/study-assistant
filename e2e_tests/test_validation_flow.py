import pytest
from httpx import AsyncClient, ASGITransport

from main import app
from mail_validation.settings import settings


@pytest.mark.asyncio
async def test_validation_endpoint_e2e():
    """Verifies flow: API Request -> Internal Syntax Validation -> Success."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/validation/validate-single?email=test@example.com")

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["status"] == "unknown"  # until DNS validation is implemented


@pytest.mark.asyncio
async def test_validation_endpoint_rejects_bad_syntax_e2e():
    """Verifies malformed email addresses are rejected before any further processing."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.post("/validation/validate-single?email=not-an-email")

        assert response.status_code == 422
        detail = response.json()["detail"]
        assert detail["layer"] == "syntax"
        assert detail["valid"] is False
        assert detail["reason"] in {"missing_at", "invalid_format"}


@pytest.mark.asyncio
async def test_postmark_webhook_success_e2e():
    """Verifies successful recording of a valid Postmark event."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {"Email": "bounce@example.com", "Type": "HardBounce"}
        headers = {"X-Postmark-Secret": settings.postmark_webhook_secret}

        response = await ac.post("/webhooks/postmark", json=payload, headers=headers)
        assert response.status_code == 200
        assert response.json()["status"] == "recorded"


@pytest.mark.asyncio
async def test_postmark_webhook_security_rejection_e2e():
    """Verifies that an invalid secret triggers a 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {"Email": "bounce@example.com", "Type": "HardBounce"}
        headers = {"X-Postmark-Secret": "wrong_secret"}

        response = await ac.post("/webhooks/postmark", json=payload, headers=headers)
        assert response.status_code == 401
        assert response.json()["detail"] == "Unauthorized: Invalid Webhook Secret"


@pytest.mark.asyncio
async def test_postmark_webhook_invalid_json_e2e():
    """Verifies the webhook returns 400 when receiving malformed JSON."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = {"X-Postmark-Secret": settings.postmark_webhook_secret}

        response = await ac.post("/webhooks/postmark", content="not-json", headers=headers)
        assert response.status_code == 400
        assert response.json()["detail"] == "Malformed JSON payload"


@pytest.mark.asyncio
async def test_postmark_webhook_stats_and_metrics_e2e():
    """Verifies that the Prometheus metrics are actually updated."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {"Email": "bounce@example.com", "Type": "HardBounce"}
        headers = {"X-Postmark-Secret": settings.postmark_webhook_secret}

        await ac.post("/webhooks/postmark", json=payload, headers=headers)

        metrics_response = await ac.get("/metrics")
        assert metrics_response.status_code == 200
        assert "postmark_bounce_events_total" in metrics_response.text
        assert 'event_type="HardBounce"' in metrics_response.text

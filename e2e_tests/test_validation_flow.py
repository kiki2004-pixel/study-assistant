import pytest
import respx
import httpx
from httpx import AsyncClient, ASGITransport
from main import app
from mail_validation.settings import settings


@pytest.mark.asyncio
async def test_validation_endpoint_e2e():
    """Verifies flow: API Request -> Mails.so Mock -> Success."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        with respx.mock:
            # FIX: url__startswith ensures we catch the /v1/validate call
            respx.get(url__startswith="https://api.mails.so").mock(
                return_value=httpx.Response(
                    200, json={"result": "deliverable", "score": 100}
                )
            )

            response = await ac.post(
                "/validation/validate-single?email=test@example.com"
            )
            assert response.status_code == 200
            assert response.json()["status"] == "deliverable"


@pytest.mark.asyncio
async def test_postmark_webhook_success_e2e():
    """Verifies successful recording of a valid Postmark event."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        payload = {"Email": "bounce@example.com", "Type": "HardBounce"}
        headers = {"X-Postmark-Secret": settings.postmark_webhook_secret}

        response = await ac.post("/webhooks/postmark", json=payload, headers=headers)
        assert response.status_code == 200
        assert response.json()["status"] == "recorded"


@pytest.mark.asyncio
async def test_postmark_webhook_security_rejection_e2e():
    """Verifies that an invalid secret triggers a 401."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        payload = {"Email": "bounce@example.com", "Type": "HardBounce"}
        headers = {"X-Postmark-Secret": "wrong_secret"}

        response = await ac.post("/webhooks/postmark", json=payload, headers=headers)
        assert response.status_code == 401
        # FIX: Match the exact 'Unauthorized:' string from your router
        assert response.json()["detail"] == "Unauthorized: Invalid Webhook Secret"


@pytest.mark.asyncio
async def test_postmark_webhook_invalid_json_e2e():
    """Verifies the webhook returns 400 when receiving malformed JSON."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        headers = {"X-Postmark-Secret": settings.postmark_webhook_secret}

        # Send non-JSON text
        response = await ac.post(
            "/webhooks/postmark", content="not-json", headers=headers
        )
        assert response.status_code == 400
        assert response.json()["detail"] == "Malformed JSON payload"


@pytest.mark.asyncio
async def test_postmark_webhook_stats_and_metrics_e2e():
    """Verifies that the Prometheus metrics are actually updated."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        payload = {"Email": "bounce@example.com", "Type": "HardBounce"}
        headers = {"X-Postmark-Secret": settings.postmark_webhook_secret}

        # 1. Trigger the webhook
        await ac.post("/webhooks/postmark", json=payload, headers=headers)

        # 2. Verify metrics exposure
        metrics_response = await ac.get("/metrics")
        assert metrics_response.status_code == 200
        # FIX: Check for metric name and label presence (robust against multiple runs)
        assert "postmark_bounce_events_total" in metrics_response.text
        assert 'event_type="HardBounce"' in metrics_response.text

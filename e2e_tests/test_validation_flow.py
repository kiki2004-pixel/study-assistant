import pytest
import respx
import httpx
from httpx import AsyncClient, ASGITransport
from main import app
from mail_validation.settings import settings

@pytest.mark.asyncio
async def test_validation_endpoint_e2e():
    """Verifies flow: API Request -> Mails.so Mock -> Success."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        with respx.mock:
            # Matches exact endpoint used in mailso_client.py
            respx.get(url__startswith="https://api.mails.so").mock(
                return_value=httpx.Response(200, json={"result": "deliverable", "score": 100})
            )

            response = await ac.post("/validation/validate-single?email=test@example.com")

            assert response.status_code == 200
            assert response.json()["status"] == "deliverable"

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
    """Verifies that an invalid secret triggers an AssertionError (500)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {"Email": "bounce@example.com", "Type": "HardBounce"}
        headers = {"X-Postmark-Secret": "wrong_secret"}

        response = await ac.post("/webhooks/postmark", json=payload, headers=headers)

        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid Webhook Secret"

@pytest.mark.asyncio
async def test_postmark_webhook_invalid_json_e2e():
    """Verifies the webhook returns 400 when receiving malformed JSON."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        headers = {"X-Postmark-Secret": settings.postmark_webhook_secret}
        
        # Sending raw text instead of a JSON object
        response = await ac.post(
            "/webhooks/postmark", 
            content="not-json", 
            headers=headers
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Malformed JSON payload"
@pytest.mark.asyncio
async def test_postmark_webhook_stats_and_metrics_e2e():
    """
    Verifies that the webhook records the event AND the 
    Prometheus metrics are updated.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "Email": "bounce@example.com",
            "Type": "HardBounce"
        }
        headers = {"X-Postmark-Secret": settings.postmark_webhook_secret}

        # 1. Trigger the webhook
        response = await ac.post("/webhooks/postmark", json=payload, headers=headers)
        assert response.status_code == 200
        assert response.json()["status"] == "recorded"

        # 2. Verify the Prometheus Metric 
        # We hit the /metrics endpoint exposed by the Instrumentator
        metrics_response = await ac.get("/metrics")
        assert metrics_response.status_code == 200
        
        # Verify the specific metric line exists in the output
        metric_line = 'postmark_bounce_events_total{event_type="HardBounce",source="postmark"} 1.0'
        assert metric_line in metrics_response.text

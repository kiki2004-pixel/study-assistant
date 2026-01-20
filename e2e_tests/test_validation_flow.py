import pytest
import respx
import httpx
from httpx import AsyncClient, ASGITransport
from main import app
from mail_validation.settings import settings

@pytest.mark.asyncio
async def test_validation_endpoint_e2e():
    """
    verification
    Verifies the flow: API Request -> Mails.so Mock -> Success Response.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        with respx.mock:
            # Replace old mocks with correct httpx.Response and full URLs
            respx.get("https://api.mails.so").mock(
                return_value=httpx.Response(200, json={"result": "deliverable", "score": 100})
            )

            response = await ac.post("/validation/validate-single?email=test@example.com")

            assert response.status_code == 200
            assert response.json()["status"] == "deliverable"

@pytest.mark.asyncio
async def test_postmark_webhook_stats_e2e():
    """
    Postmark Webhook Statistics.
    Verifies that the webhook records the event without calling external APIs.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        
        payload = {
            "Email": "bounce@example.com",
            "Type": "HardBounce",
            "Description": "Destination server unavailable"
        }
        headers = {"X-Postmark-Secret": settings.postmark_webhook_secret}

        response = await ac.post("/webhooks/postmark", json=payload, headers=headers)

        # Assertions for the new "Stats Only" logic
        assert response.status_code == 200
        assert response.json()["status"] == "recorded"
        assert response.json()["event"] == "HardBounce"

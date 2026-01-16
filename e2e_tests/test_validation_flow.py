import os

# Set dummy env vars BEFORE importing the app
os.environ["LISTMONK_URL"] = "http://localhost:9000"
os.environ["LISTMONK_PASS"] = "test_token"
os.environ["MAILS_SO_API_KEY"] = "test_key"
os.environ["POSTMARK_WEBHOOK_SECRET"] = "secret123"

import pytest
import respx
from httpx import AsyncClient, ASGITransport
from main import app  

@pytest.mark.asyncio
async def test_full_webhook_to_blacklist_flow():
    """
    E2E Test: 
    Validates that a Postmark webhook triggers a Listmonk blacklist action.
    """
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        
        # 1. Mock the Network calls so we don't hit real APIs
        with respx.mock:
            # Mock Mails.so
            respx.post("https://api.mails.so").mock(
                return_value=respx.Response(200, json={"result": "undeliverable"})
            )
            # Mock Listmonk
            respx.put("http://localhost:9000/api/subscribers/blocklist").mock(
                return_value=respx.Response(200, json={"status": "success"})
            )

            # 2. Simulate Postmark Webhook
            payload = {
                "Email": "bad-user@example.com",
                "Type": "HardBounce",
                "Description": "Account does not exist"
            }
            headers = {"X-Postmark-Secret": "secret123"}

            response = await ac.post("/webhooks/postmark", json=payload, headers=headers)

            # 3. Assertions
            assert response.status_code == 200
            assert response.json()["status"] == "success"
            assert response.json()["blacklisted"] == "bad-user@example.com"

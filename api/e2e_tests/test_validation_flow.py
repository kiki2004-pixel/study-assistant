import pytest
import os
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

# 1. Setup Environment for Settings initialization
os.environ["LISTMONK_URL"] = "http://mock-listmonk"
os.environ["LISTMONK_USER"] = "test"
os.environ["LISTMONK_PASS"] = "test"

from main import app

from scrub.settings import settings
from scrub.storage.webhook_store import WebhookStore

# Initialise webhook schema before tests run — TestClient does not
# trigger FastAPI lifespan, so init_schema() won't run automatically
WebhookStore(settings.watermark_db_url).init_schema()

# Mock Paths for Service and Client
MOCK_DNS_PATH = "scrub.services.validation_service.check_dns_records"
MOCK_LM_REQUEST = "scrub.services.listmonk_client.ListmonkClient._request"

client = TestClient(app)

# 1. API & DNS Logic Tests


def test_validate_single_success_e2e(mock_auth, mocker):
    """Verifies: API -> DNS Service -> Deliverable status."""
    mocker.patch(
        MOCK_DNS_PATH,
        return_value={
            "is_valid": True,
            "reason": "MAIL_SERVER_FOUND",
            "details": {"mx_found": True},
        },
    )
    response = client.post("/validation/validate-single?email=valid@example.com")
    assert response.status_code == 200
    assert response.json()["status"] == "deliverable"


def test_validate_single_dns_failure_e2e(mock_auth, mocker):
    """Verifies: API -> DNS Service -> Undeliverable status."""
    mocker.patch(
        MOCK_DNS_PATH,
        return_value={
            "is_valid": False,
            "reason": "NO_MAIL_SERVER_CONFIGURED",
            "details": {},
        },
    )
    response = client.post("/validation/validate-single?email=dead@example.com")
    assert response.status_code == 200
    assert response.json()["status"] == "undeliverable"


def test_validate_bulk_summary_e2e(mock_auth, mocker):
    """Verifies: Bulk API handles multiple emails and DNS mocking."""
    mocker.patch(
        MOCK_DNS_PATH, return_value={"is_valid": True, "reason": "OK", "details": {}}
    )
    payload = {"emails": ["a@test.com", "b@test.com"], "response_mode": "summary_only"}
    response = client.post("/validation/validate-bulk", json=payload)
    assert response.status_code == 200
    assert response.json()["summary"]["total"] == 2


# 2. Listmonk Automation Tests


@pytest.mark.asyncio
async def test_listmonk_client_logic_mocked():
    """Verifies the Async Client can parse Listmonk's list data."""
    mock_data = {"data": {"results": [{"id": 1, "name": "Main List"}]}}
    with patch(MOCK_LM_REQUEST, new_callable=AsyncMock) as mock_req:
        mock_req.return_value = mock_data
        async with ListmonkClient(
            base_url="http://test", username="a", password="b"
        ) as lc:
            lists = await lc.fetch_lists()
            assert lists[0].name == "Main List"


@pytest.mark.asyncio
async def test_listmonk_auto_unsubscribe_logic_mocked():
    """Verifies the Worker's ability to command an 'unsubscribe' in Listmonk."""
    with patch(MOCK_LM_REQUEST, new_callable=AsyncMock) as mock_req:
        mock_req.return_value = {"ok": True}
        async with ListmonkClient(
            base_url="http://test", username="a", password="b"
        ) as lc:
            # IDs 101 and 102 are marked for removal after DNS failure
            await lc.bulk_unsubscribe(list_id=1, ids=[101, 102])

        # Verify call arguments match Listmonk API specs
        _, kwargs = mock_req.call_args
        assert kwargs["json"]["action"] == "unsubscribe"
        assert 101 in kwargs["json"]["ids"]


# 3. System Health


def test_metrics_endpoint_active():
    """Ensures Prometheus metrics are exposed for monitoring."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "process_cpu_seconds_total" in response.text

import os
from fastapi.testclient import TestClient

# 1. Setup Environment for Settings initialization
os.environ["LISTMONK_URL"] = "http://mock-listmonk"
os.environ["LISTMONK_USER"] = "test"
os.environ["LISTMONK_PASS"] = "test"

from main import app
from mail_validation.settings import settings
from mail_validation.storage.webhook_store import WebhookStore

# Initialise webhook schema before tests run — TestClient does not
# trigger FastAPI lifespan, so init_schema() won't run automatically
WebhookStore(settings.watermark_db_url).init_schema()

# Mock Paths for Service and Client
MOCK_DNS_PATH = "mail_validation.services.validation_service.check_dns_records"
MOCK_LM_REQUEST = "mail_validation.services.listmonk_client.ListmonkClient._request"

client = TestClient(app)

# 1. API & DNS Logic Tests


def test_validate_single_success_e2e(mocker):
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


def test_validate_single_dns_failure_e2e(mocker):
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


def test_validate_bulk_summary_e2e(mocker):
    """Verifies: Bulk API handles multiple emails and DNS mocking."""
    mocker.patch(
        MOCK_DNS_PATH, return_value={"is_valid": True, "reason": "OK", "details": {}}
    )
    payload = {"emails": ["a@test.com", "b@test.com"], "response_mode": "summary_only"}
    response = client.post("/validation/validate-bulk", json=payload)
    assert response.status_code == 200
    assert response.json()["summary"]["total"] == 2


# 2. Listmonk Automation Tests


def test_metrics_endpoint_active():
    """Ensures Prometheus metrics are exposed for monitoring."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "process_cpu_seconds_total" in response.text
import atexit
import os
import tempfile
import pytest
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

# 1. Setup Environment for Settings initialization
os.environ["LISTMONK_URL"] = "http://mock-listmonk"
os.environ["LISTMONK_USER"] = "test"
os.environ["LISTMONK_PASS"] = "test"
os.environ["API_KEY"] = "test-api-key"
os.environ["SSRF_PROTECTION_ENABLED"] = "false"

# Use a temp SQLite file so tests don't mutate a real DB or leak state between runs
_fd, _db_path = tempfile.mkstemp(suffix=".db")
os.close(_fd)
os.environ["WATERMARK_DB_URL"] = f"sqlite:///{_db_path}"
atexit.register(lambda: os.path.exists(_db_path) and os.remove(_db_path))

from main import app  # noqa: E402
from scrub.auth import verify_token  # noqa: E402
from scrub.settings import settings  # noqa: E402
from scrub.storage.webhook_store import WebhookStore  # noqa: E402
from scrub.storage.history_store import HistoryStore  # noqa: E402
from scrub.routers.validation_router import get_user_store  # noqa: E402

# Initialise schemas before tests run — TestClient does not trigger lifespan
WebhookStore(settings.watermark_db_url).init_schema()
HistoryStore(settings.watermark_db_url).init_schema()

# Mock Paths for Service and Client
MOCK_DNS_PATH = "scrub.services.validation_service.check_dns_records"
MOCK_LM_REQUEST = "scrub.services.listmonk_client.ListmonkClient._request"

client = TestClient(app)
API_HEADERS = {"X-API-Key": "test-api-key"}


async def _mock_verify_token():
    return {"sub": "test-user", "email": "test@example.com", "name": "Test"}


@pytest.fixture(autouse=False)
def mock_auth():
    """Override auth and user store for tests that don't test auth itself."""
    app.dependency_overrides[verify_token] = _mock_verify_token
    app.dependency_overrides[get_user_store] = lambda: MagicMock()
    yield
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# 1. API & DNS Logic Tests
# ---------------------------------------------------------------------------

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


def test_validate_single_requires_auth():
    """Verifies: validate-single returns 401 when no token is provided."""
    response = client.post("/validation/validate-single?email=test@example.com")
    assert response.status_code == 401


def test_validate_bulk_requires_auth():
    """Verifies: validate-bulk returns 401 when no token is provided."""
    payload = {"emails": ["a@test.com"], "response_mode": "summary_only"}
    response = client.post("/validation/validate-bulk", json=payload)
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 2. Listmonk Automation Tests
# ---------------------------------------------------------------------------

def test_metrics_endpoint_active():
    """Ensures Prometheus metrics are exposed for monitoring."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "process_cpu_seconds_total" in response.text

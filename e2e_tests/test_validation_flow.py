import os
from unittest.mock import AsyncMock
from fastapi.testclient import TestClient

# 1. Setup Environment for Settings initialization
os.environ["LISTMONK_URL"] = "http://mock-listmonk"
os.environ["LISTMONK_USER"] = "test"
os.environ["LISTMONK_PASS"] = "test"
os.environ["API_KEY"] = "test-api-key"
os.environ["SSRF_PROTECTION_ENABLED"] = "false"

from main import app
from mail_validation.settings import settings
from mail_validation.storage.webhook_store import WebhookStore

# Initialise webhook schema before tests run — TestClient does not
# trigger FastAPI lifespan, so init_schema() won't run automatically
WebhookStore(settings.watermark_db_url).init_schema()

# Mock Paths for Service and Client
MOCK_DNS_PATH = "mail_validation.services.validation_service.check_dns_records"
MOCK_LM_REQUEST = "mail_validation.services.listmonk_client.ListmonkClient._request"
MOCK_DISPATCH = "mail_validation.routers.validation_router.dispatch_webhook"

client = TestClient(app)
API_HEADERS = {"X-API-Key": "test-api-key"}


# ---------------------------------------------------------------------------
# 1. API & DNS Logic Tests
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# 2. Listmonk Automation Tests
# ---------------------------------------------------------------------------

def test_metrics_endpoint_active():
    """Ensures Prometheus metrics are exposed for monitoring."""
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "process_cpu_seconds_total" in response.text


# ---------------------------------------------------------------------------
# 3. Webhook Registration Tests
# ---------------------------------------------------------------------------

def test_register_webhook_returns_url_and_secret():
    """POST /webhooks/register returns url and secret."""
    response = client.post(
        "/webhooks/register",
        json={"url": "https://example.com/webhook"},
        headers=API_HEADERS,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["url"] == "https://example.com/webhook"
    assert "secret" in data
    assert len(data["secret"]) == 64


def test_register_webhook_requires_api_key():
    """POST /webhooks/register returns 401 without API key."""
    response = client.post(
        "/webhooks/register",
        json={"url": "https://example.com/webhook"},
    )
    assert response.status_code == 401


def test_deregister_webhook():
    """DELETE /webhooks/deregister removes a registered webhook."""
    client.post(
        "/webhooks/register",
        json={"url": "https://example.com/to-remove"},
        headers=API_HEADERS,
    )
    response = client.delete(
        "/webhooks/deregister",
        params={"url": "https://example.com/to-remove"},
        headers=API_HEADERS,
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Webhook deregistered successfully."


def test_deregister_nonexistent_webhook():
    """DELETE /webhooks/deregister returns 404 for unknown URL."""
    response = client.delete(
        "/webhooks/deregister",
        params={"url": "https://example.com/does-not-exist"},
        headers=API_HEADERS,
    )
    assert response.status_code == 404


def test_list_webhooks_requires_api_key():
    """GET /webhooks/list returns 401 without API key."""
    response = client.get("/webhooks/list")
    assert response.status_code == 401


# ---------------------------------------------------------------------------
# 4. Webhook Dispatch Tests
# ---------------------------------------------------------------------------

def test_validate_single_dispatches_webhook(mocker):
    """Triggering validate-single schedules webhook dispatch."""
    mock_dispatch = mocker.patch(MOCK_DISPATCH, new_callable=AsyncMock)
    mocker.patch(
        MOCK_DNS_PATH,
        return_value={"is_valid": True, "reason": "MAIL_SERVER_FOUND", "details": {}},
    )
    client.post("/validation/validate-single?email=test@example.com")
    assert mock_dispatch.called
    call_args = mock_dispatch.call_args[0][1]
    assert call_args["endpoint"] == "single"
    assert "summary" in call_args


def test_validate_bulk_dispatches_webhook(mocker):
    """Triggering validate-bulk schedules webhook dispatch."""
    mock_dispatch = mocker.patch(MOCK_DISPATCH, new_callable=AsyncMock)
    mocker.patch(
        MOCK_DNS_PATH,
        return_value={"is_valid": True, "reason": "OK", "details": {}},
    )
    client.post(
        "/validation/validate-bulk",
        json={"emails": ["a@test.com"], "response_mode": "all"},
    )
    assert mock_dispatch.called
    call_args = mock_dispatch.call_args[0][1]
    assert call_args["endpoint"] == "bulk"
    assert "summary" in call_args


def test_webhook_payload_includes_signature():
    """sign_payload produces a valid HMAC-SHA256 signature."""
    import hmac
    import hashlib
    store = WebhookStore(settings.watermark_db_url)
    secret = "test-secret"
    body = b'{"event": "validation.completed"}'
    signature = store.sign_payload(secret, body)
    expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    assert signature == expected


def test_webhook_failure_tracking():
    """record_failure increments count and deactivates after MAX_FAILURES."""
    store = WebhookStore(settings.watermark_db_url)
    reg = store.register("https://example.com/failure-test")
    for _ in range(store.MAX_FAILURES):
        store.record_failure(reg.id)
    active = store.list_active()
    urls = [r.url for r in active]
    assert not any("failure-test" in url for url in urls)


def test_webhook_success_resets_failure_count():
    """record_success resets failure count and keeps webhook active."""
    store = WebhookStore(settings.watermark_db_url)
    reg = store.register("https://example.com/success-reset")
    store.record_failure(reg.id)
    store.record_success(reg.id)
    active = store.list_active()
    urls = [r.url for r in active]
    assert any("success-reset" in url for url in urls)
test_validation.py
import os

<<<<<<< HEAD
os.environ["LISTMONK_URL"] = "http://localhost"
os.environ["LISTMONK_USER"] = "test"
os.environ["LISTMONK_PASS"] = "test"
os.environ["POSTMARK_WEBHOOK_SECRET"] = "test"  # needed for settings init
os.environ["MX_CHECK_ENABLED"] = "false"

from mail_validation.settings import get_settings

get_settings.cache_clear()

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)
=======
# 1. Set environment variables BEFORE imports to satisfy Settings initialization
os.environ["LISTMONK_URL"] = "http://localhost"
os.environ["LISTMONK_USER"] = "test"
os.environ["LISTMONK_PASS"] = "test"
os.environ["POSTMARK_WEBHOOK_SECRET"] = "test"

# 2. Imports
from main import app

# Target path for mocking the DNS service within the validation logic
MOCK_DNS_PATH = "mail_validation.services.validation_service.check_dns_records"

@pytest.fixture(scope="module")
def client():
    """Reusable TestClient instance."""
    return TestClient(app)
>>>>>>> 5ca869b (Implement background DNS validation worker with automatic Listmonk unsubscription logic.)

# 3. DNS-Based Single Validation Tests

def test_valid_email_passes_dns(client, mocker):
    """Verifies that an email with valid DNS returns deliverable."""
    mocker.patch(MOCK_DNS_PATH, return_value={
        "is_valid": True,
        "reason": "MAIL_SERVER_FOUND",
        "details": {"mx_found": True}
    })

<<<<<<< HEAD
def test_valid_email_passes_syntax():
    response = client.post("/validation/validate-single?email=good@example.com")
    assert response.status_code == 200
    assert response.json()["status"] == "unknown"  # MX checks disabled in tests
=======
    response = client.post("/validation/validate-single?email=good@example.com")
    assert response.status_code == 200
    assert response.json()["status"] == "deliverable"
>>>>>>> 5ca869b (Implement background DNS validation worker with automatic Listmonk unsubscription logic.)

def test_invalid_dns_rejected(client, mocker):
    """Verifies that a DNS failure returns undeliverable."""
    mocker.patch(MOCK_DNS_PATH, return_value={
        "is_valid": False,
        "reason": "NO_MAIL_SERVER_CONFIGURED",
        "details": {"mx_found": False}
    })

    response = client.post("/validation/validate-single?email=bad-dns@example.com")
    assert response.status_code == 200
    assert response.json()["status"] == "undeliverable"
    assert response.json()["reason"] == "NO_MAIL_SERVER_CONFIGURED"

<<<<<<< HEAD
def test_invalid_email_format_rejected():
=======
def test_invalid_email_format_rejected(client):
    """Pydantic/FastAPI syntax check (Layer 1) happens before DNS logic."""
>>>>>>> 5ca869b (Implement background DNS validation worker with automatic Listmonk unsubscription logic.)
    response = client.post("/validation/validate-single?email=not-an-email")
    assert response.status_code == 422

# 4. Bulk Validation Tests

def test_multiple_at_rejected():
    response = client.post("/validation/validate-single?email=a@@example.com")
    assert response.status_code == 422
    assert response.json()["detail"]["reason"] == "multiple_at"

def test_validate_bulk_summary_only(client, mocker):
    """Verifies bulk processing summary for a mix of valid/invalid syntax."""
    mocker.patch(MOCK_DNS_PATH, return_value={"is_valid": True, "reason": "OK", "details": {}})

    payload = {
        "emails": ["good@example.com", "bad-email", "a@@example.com"],
        "response_mode": "summary_only",
        "dedupe": False,
    }
    r = client.post("/validation/validate-bulk", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["summary"]["total"] == 3
    assert data["summary"]["invalid"] == 2
    assert data["summary"]["valid"] == 1


def test_validate_bulk_invalid_only():
    payload = {
        "emails": ["good@example.com", "bad-email"],
        "response_mode": "invalid_only",
        "dedupe": False,
    }
    r = client.post("/validation/validate-bulk", json=payload)
    assert r.status_code == 200
    results = r.json()["results"]
    assert len(results) == 1
    assert results[0]["email"] == "bad-email"
    assert results[0]["valid"] is False


def test_validate_bulk_rejects_over_limit(client):
    """Ensures bulk limit of 30,000 is enforced via Pydantic."""
    payload = {"emails": [f"user{i}@example.com" for i in range(30001)]}
    r = client.post("/validation/validate-bulk", json=payload)
    assert r.status_code == 422

def test_validate_bulk_dedupe_removes_duplicates(client, mocker):
    """Verifies that the deduplication flag correctly reduces processed count."""
    mocker.patch(MOCK_DNS_PATH, return_value={"is_valid": True, "reason": "OK", "details": {}})

    payload = {
        "emails": ["a@example.com", "a@example.com", "b@example.com"],
        "response_mode": "summary_only",
        "dedupe": True,
    }
    r = client.post("/validation/validate-bulk", json=payload)
    summary = r.json()["summary"]
    assert summary["total"] == 3
    assert summary["duplicates_removed"] == 1
    assert summary["processed"] == 2

def test_bulk_does_not_fail_on_internal_error(client, monkeypatch):
    """
    FIXED: Uses 'async def' to match the new asynchronous router/service.
    Verifies that a single failed validation doesn't crash the entire bulk run.
    """

    import mail_validation.routers.validation_router as vr

    async def async_boom(email: str):
        if email == "explode@example.com":
            raise RuntimeError("boom")
        return {"ok": True, "status": "deliverable", "details": {}}

    # Patch the service call within the router
    monkeypatch.setattr(vr, "validate_email_internal", async_boom)

    payload = {
        "emails": ["ok@example.com", "explode@example.com"],
        "response_mode": "all",
        "dedupe": False,
    }
    r = client.post("/validation/validate-bulk", json=payload)
    assert r.status_code == 200

    data = r.json()
    assert data["summary"]["errors"] == 1
    assert any(x["status"] == "error" for x in data["results"])


def test_validate_bulk_dedupe_removes_duplicates():
    payload = {
        "emails": [
            "a@example.com",
            "a@example.com",
            "b@example.com",
            "b@example.com",
            "c@example.com",
        ],
        "response_mode": "summary_only",
        "dedupe": True,
    }

    r = client.post("/validation/validate-bulk", json=payload)
    assert r.status_code == 200

    data = r.json()
    summary = data["summary"]

    assert summary["total"] == 5

    assert summary["processed"] == 3

    assert summary["duplicates_removed"] == 2
    assert summary["deduped"] is True

    assert summary["valid"] == 3
    assert summary["invalid"] == 0
    assert summary["errors"] == 0


def test_mx_undeliverable_returns_200(monkeypatch):
    from mail_validation.validators.email_mx import EmailMxResult
    import mail_validation.services.validation_service as vs

    monkeypatch.setattr(
        vs,
        "validate_email_mx",
        lambda domain: EmailMxResult(
            ok=False,
            status="undeliverable",
            reason="mx_not_found",
            message="No MX records found.",
        ),
    )

    response = client.post("/validation/validate-single?email=good@example.com")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "undeliverable"

    assert data["reason"] == "mx_not_found"
    # Expected: 1 error (explode@example.com) and 1 success (ok@example.com)
    assert r.json()["summary"]["errors"] == 1

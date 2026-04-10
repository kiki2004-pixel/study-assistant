import os
import pytest
from fastapi.testclient import TestClient

# 1. Set environment variables BEFORE imports to satisfy Settings initialization
os.environ["LISTMONK_URL"] = "http://localhost"
os.environ["LISTMONK_USER"] = "test"
os.environ["LISTMONK_PASS"] = "test"
os.environ["POSTMARK_WEBHOOK_SECRET"] = "test"

# 2. Imports
from main import app

# Target path for mocking the DNS service within the validation logic
MOCK_DNS_PATH = "scrub.services.validation_service.check_dns_records"


_FAKE_USER = {"sub": "test-user", "email": "test@example.com", "name": "Test"}


async def _fake_auth():
    return _FAKE_USER


@pytest.fixture(scope="module")
def client():
    """Reusable TestClient instance."""
    return TestClient(app)


# 3. DNS-Based Single Validation Tests


def test_valid_email_passes_dns(client, mocker):
    """Verifies that an email with valid DNS returns deliverable."""
    mocker.patch(
        MOCK_DNS_PATH,
        return_value={
            "is_valid": True,
            "reason": "MAIL_SERVER_FOUND",
            "details": {"mx_found": True},
        },
    )

    response = client.post("/validation/validate-single?email=good@example.com")
    assert response.status_code == 200
    assert response.json()["status"] == "deliverable"


def test_invalid_dns_rejected(client, mocker):
    """Verifies that a DNS failure returns undeliverable."""
    mocker.patch(
        MOCK_DNS_PATH,
        return_value={
            "is_valid": False,
            "reason": "NO_MAIL_SERVER_CONFIGURED",
            "details": {"mx_found": False},
        },
    )

    response = client.post("/validation/validate-single?email=bad-dns@example.com")
    assert response.status_code == 200
    assert response.json()["status"] == "undeliverable"
    assert response.json()["reason"] == "NO_MAIL_SERVER_CONFIGURED"


def test_invalid_email_format_rejected(client):
    """Pydantic/FastAPI syntax check (Layer 1) happens before DNS logic."""
    response = client.post("/validation/validate-single?email=not-an-email")
    assert response.status_code == 422


# 4. Bulk Validation Tests


def test_validate_bulk_summary_only(client, mocker):
    """Verifies bulk processing summary for a mix of valid/invalid syntax."""
    mocker.patch(
        MOCK_DNS_PATH, return_value={"is_valid": True, "reason": "OK", "details": {}}
    )

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


def test_validate_bulk_rejects_over_limit(client):
    """Ensures bulk limit of 30,000 is enforced via Pydantic."""
    payload = {"emails": [f"user{i}@example.com" for i in range(30001)]}
    r = client.post("/validation/validate-bulk", json=payload)
    assert r.status_code == 422


def test_validate_bulk_dedupe_removes_duplicates(client, mocker):
    """Verifies that the deduplication flag correctly reduces processed count."""
    mocker.patch(
        MOCK_DNS_PATH, return_value={"is_valid": True, "reason": "OK", "details": {}}
    )

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
    import scrub.services.validation_orchestrator as orch

    async def async_boom(email: str):
        if email == "explode@example.com":
            raise RuntimeError("boom")
        return {"ok": True, "status": "deliverable", "details": {}}

    # Patch the service call within the orchestrator (moved out of the router)
    monkeypatch.setattr(orch, "validate_email_internal", async_boom)

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

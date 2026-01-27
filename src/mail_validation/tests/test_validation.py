import os
import pytest
from fastapi.testclient import TestClient

# ----------------------------
# Set environment variables first
# ----------------------------
os.environ["LISTMONK_URL"] = "http://localhost"
os.environ["LISTMONK_USER"] = "test"
os.environ["LISTMONK_PASS"] = "test"
os.environ["POSTMARK_WEBHOOK_SECRET"] = "test"
os.environ["MX_CHECK_ENABLED"] = "false"

# ----------------------------
# Import after env variables
# ----------------------------
from mail_validation.settings import get_settings
from main import app

# Clear cached settings after imports
get_settings.cache_clear()

# ----------------------------
# Test client fixture
# ----------------------------
@pytest.fixture(scope="module")
def client():
    return TestClient(app)


# ----------------------------
# Tests for single email validation
# ----------------------------
def test_valid_email_passes_syntax(client):
    response = client.post("/validation/validate-single?email=good@example.com")
    assert response.status_code == 200
    assert response.json()["status"] == "unknown"  # MX checks disabled


def test_invalid_email_format_rejected(client):
    response = client.post("/validation/validate-single?email=not-an-email")
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["layer"] == "syntax"
    assert detail["valid"] is False


def test_multiple_at_rejected(client):
    response = client.post("/validation/validate-single?email=a@@example.com")
    assert response.status_code == 422
    assert response.json()["detail"]["reason"] == "multiple_at"


# ----------------------------
# Tests for bulk email validation
# ----------------------------
def test_validate_bulk_summary_only(client):
    payload = {
        "emails": ["good@example.com", "bad-email", "a@@example.com"],
        "response_mode": "summary_only",
        "dedupe": False,
    }
    r = client.post("/validation/validate-bulk", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["results"] is None
    assert data["summary"]["total"] == 3
    assert data["summary"]["invalid"] == 2
    assert data["summary"]["valid"] == 1


def test_validate_bulk_invalid_only(client):
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
    payload = {"emails": [f"user{i}@example.com" for i in range(30001)]}
    r = client.post("/validation/validate-bulk", json=payload)
    assert r.status_code == 422  # Pydantic validation error


def test_bulk_does_not_fail_on_internal_error(client, monkeypatch):
    import mail_validation.routers.validation_router as vr

    def boom(email: str):
        if email == "explode@example.com":
            raise RuntimeError("boom")
        return {
            "ok": True,
            "layer": "syntax",
            "status": "unknown",
            "reason": None,
            "details": {},
        }

    monkeypatch.setattr(vr, "validate_email_internal", boom)
    payload = {
        "emails": ["ok@example.com", "explode@example.com", "ok2@example.com"],
        "response_mode": "all",
        "dedupe": False,
    }
    r = client.post("/validation/validate-bulk", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert data["summary"]["errors"] == 1
    assert any(x["status"] == "error" for x in data["results"])


def test_validate_bulk_dedupe_removes_duplicates(client):
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
    summary = r.json()["summary"]
    assert summary["total"] == 5
    assert summary["processed"] == 3
    assert summary["duplicates_removed"] == 2
    assert summary["deduped"] is True
    assert summary["valid"] == 3
    assert summary["invalid"] == 0
    assert summary["errors"] == 0


# ----------------------------
# MX-specific tests
# ----------------------------
def test_mx_undeliverable_returns_200(client, monkeypatch):
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

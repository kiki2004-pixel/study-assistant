import os

os.environ["LISTMONK_URL"] = "http://localhost"
os.environ["LISTMONK_USER"] = "test"
os.environ["LISTMONK_PASS"] = "test"
os.environ["POSTMARK_WEBHOOK_SECRET"] = "test"  # needed for settings init

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_valid_email_passes_syntax():
    response = client.post("/validation/validate-single?email=good@example.com")
    assert response.status_code == 200
    assert response.json()["status"] in {"unknown"}  # until DNS layer exists


def test_invalid_email_format_rejected():
    response = client.post("/validation/validate-single?email=not-an-email")
    assert response.status_code == 422
    detail = response.json()["detail"]
    assert detail["layer"] == "syntax"
    assert detail["valid"] is False


def test_multiple_at_rejected():
    response = client.post("/validation/validate-single?email=a@@example.com")
    assert response.status_code == 422
    assert response.json()["detail"]["reason"] == "multiple_at"

def test_validate_bulk_summary_only():
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


def test_validate_bulk_rejects_over_limit():
    payload = {"emails": [f"user{i}@example.com" for i in range(30001)]}
    r = client.post("/validation/validate-bulk", json=payload)
    assert r.status_code == 422  # Pydantic validation error

def test_bulk_does_not_fail_on_internal_error(monkeypatch):
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


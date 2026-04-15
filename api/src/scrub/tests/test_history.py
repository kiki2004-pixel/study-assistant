"""Tests for validation history storage and API endpoints."""
import os
import uuid
import pytest
from fastapi.testclient import TestClient

# Set env vars BEFORE any app import
os.environ.setdefault("LISTMONK_URL", "http://localhost")
os.environ.setdefault("LISTMONK_USER", "test")
os.environ.setdefault("LISTMONK_PASS", "test")
os.environ.setdefault("POSTMARK_WEBHOOK_SECRET", "test")
os.environ.setdefault("API_KEY", "test-api-key")

from scrub.storage.history_store import HistoryStore  # noqa: E402
from scrub.routers.history_router import get_history_store  # noqa: E402
from main import app  # noqa: E402


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def db_path(tmp_path):
    """Return a SQLite URL backed by a temp file (shared across connections)."""
    return f"sqlite:///{tmp_path}/test_history.db"


@pytest.fixture()
def store(db_path):
    """Fresh file-backed HistoryStore for each test."""
    s = HistoryStore(db_path)
    s.init_schema()
    return s


@pytest.fixture()
def client(store):
    """TestClient with history store dependency overridden to use temp SQLite."""
    app.dependency_overrides[get_history_store] = lambda: store
    yield TestClient(app)
    app.dependency_overrides.pop(get_history_store, None)


# ---------------------------------------------------------------------------
# HistoryStore unit tests
# ---------------------------------------------------------------------------


def test_save_and_retrieve_by_email(store):
    store.save(email="user@example.com", is_valid=True, quality_score=90)
    records = store.get_by_email("user@example.com")
    assert len(records) == 1
    assert records[0].email == "user@example.com"
    assert records[0].is_valid is True
    assert records[0].quality_score == 90


def test_get_history_pagination(store):
    for i in range(5):
        store.save(email=f"u{i}@example.com", is_valid=True)
    records, total = store.get_history(page=1, page_size=3)
    assert total == 5
    assert len(records) == 3
    records_p2, _ = store.get_history(page=2, page_size=3)
    assert len(records_p2) == 2


def test_get_history_filter_by_is_valid(store):
    store.save(email="good@example.com", is_valid=True)
    store.save(email="bad@example.com", is_valid=False)
    valid_records, total = store.get_history(is_valid=True)
    assert total == 1
    assert valid_records[0].email == "good@example.com"
    invalid_records, total = store.get_history(is_valid=False)
    assert total == 1
    assert invalid_records[0].email == "bad@example.com"


def test_get_by_request_id(store):
    req_id = str(uuid.uuid4())
    store.save(email="a@example.com", is_valid=True, request_id=req_id)
    store.save(email="b@example.com", is_valid=False, request_id=req_id)
    store.save(email="other@example.com", is_valid=True)  # different request
    records = store.get_by_request_id(req_id)
    assert len(records) == 2
    emails = {r.email for r in records}
    assert emails == {"a@example.com", "b@example.com"}


def test_delete_by_email(store):
    store.save(email="remove@example.com", is_valid=True)
    store.save(email="remove@example.com", is_valid=False)
    store.save(email="keep@example.com", is_valid=True)
    deleted = store.delete_by_email("remove@example.com")
    assert deleted == 2
    assert store.get_by_email("remove@example.com") == []
    assert len(store.get_by_email("keep@example.com")) == 1


def test_save_many(store):
    req_id = str(uuid.uuid4())
    entries = [
        {"email": f"m{i}@example.com", "is_valid": i % 2 == 0, "request_id": req_id}
        for i in range(4)
    ]
    store.save_many(entries)
    records = store.get_by_request_id(req_id)
    assert len(records) == 4


def test_save_many_empty_is_noop(store):
    store.save_many([])  # should not raise
    _, total = store.get_history()
    assert total == 0


def test_checks_and_attributes_roundtrip(store):
    checks = {"valid_format": True, "valid_domain": True, "can_receive_email": True}
    attributes = {"username": "user", "domain": "example.com", "is_free": False}
    store.save(
        email="rich@example.com",
        is_valid=True,
        checks=checks,
        attributes=attributes,
    )
    records = store.get_by_email("rich@example.com")
    assert records[0].checks == checks
    assert records[0].attributes == attributes


# ---------------------------------------------------------------------------
# History API endpoint tests
# ---------------------------------------------------------------------------


def test_list_history_empty(client):
    r = client.get("/validation/history")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 0
    assert data["results"] == []


def test_list_history_returns_entries(client, store):
    store.save(email="a@example.com", is_valid=True)
    store.save(email="b@example.com", is_valid=False)
    r = client.get("/validation/history")
    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 2
    assert len(data["results"]) == 2


def test_list_history_filter_valid(client, store):
    store.save(email="good@example.com", is_valid=True)
    store.save(email="bad@example.com", is_valid=False)
    r = client.get("/validation/history?is_valid=true")
    assert r.status_code == 200
    assert r.json()["total"] == 1
    assert r.json()["results"][0]["email"] == "good@example.com"


def test_get_email_history(client, store):
    store.save(email="target@example.com", is_valid=True)
    r = client.get("/validation/history/target@example.com")
    assert r.status_code == 200
    assert len(r.json()) == 1
    assert r.json()[0]["email"] == "target@example.com"


def test_get_email_history_not_found(client):
    r = client.get("/validation/history/nobody@example.com")
    assert r.status_code == 404


def test_get_bulk_history(client, store):
    req_id = str(uuid.uuid4())
    store.save(email="x@example.com", is_valid=True, request_id=req_id)
    store.save(email="y@example.com", is_valid=False, request_id=req_id)
    r = client.get(f"/validation/history/bulk/{req_id}")
    assert r.status_code == 200
    assert len(r.json()) == 2


def test_get_bulk_history_not_found(client):
    r = client.get(f"/validation/history/bulk/{uuid.uuid4()}")
    assert r.status_code == 404


def test_delete_email_history(client, store):
    store.save(email="gdpr@example.com", is_valid=True)
    r = client.delete("/validation/history/gdpr@example.com")
    assert r.status_code == 200
    assert r.json()["deleted"] == 1
    assert store.get_by_email("gdpr@example.com") == []


def test_delete_email_history_not_present_returns_zero(client):
    r = client.delete("/validation/history/ghost@example.com")
    assert r.status_code == 200
    assert r.json()["deleted"] == 0

import os
import pytest
from sqlalchemy import create_engine, text
from unittest.mock import patch

from scrub.jobs.listmonk_validator import ListmonkValidatorJob
from scrub.services.listmonk_client import ListmonkSubscriber
from scrub.storage.watermark_store import WatermarkStore, metadata

# 1. Path to mock (Must match where the worker imports it)
DNS_MOCK_PATH = "scrub.jobs.listmonk_validator.check_dns_records"


class FakeListmonkClient:
    def __init__(self, pages, *, fail_on_fetch: bool = False) -> None:
        self._pages = pages
        self._fail_on_fetch = fail_on_fetch
        self.unsubscribed_ids = []

    async def fetch_subscribers(
        self, *, list_id: int, watermark: str, page: int, per_page: int
    ):
        if self._fail_on_fetch:
            raise RuntimeError("boom")
        index = page - 1
        return self._pages[index] if index < len(self._pages) else []

    async def bulk_unsubscribe(self, *, list_id: int, ids):
        self.unsubscribed_ids.extend(ids)
        return {"ok": True}


@pytest.fixture()
def db_url():
    url = os.getenv("WATERMARK_DB_URL")
    if not url:
        pytest.skip("WATERMARK_DB_URL not set")
    engine = create_engine(url, future=True)
    metadata.create_all(engine)
    with engine.begin() as conn:
        conn.execute(text("DELETE FROM listmonk_watermark"))
    return url


async def test_dns_failure_triggers_unsubscribe(db_url):
    """
    PROVES THE REQUIREMENT: Any email failing DNS test must be UNSUBED.
    """
    store = WatermarkStore(db_url)
    pages = [
        [
            ListmonkSubscriber(
                id=101, email="dead-dns@example.com", created_at="2026-01-01T00:00:00Z"
            ),
            ListmonkSubscriber(
                id=102, email="live-dns@gmail.com", created_at="2026-01-01T00:01:00Z"
            ),
        ]
    ]

    client = FakeListmonkClient(pages)
    job = ListmonkValidatorJob(client=client, store=store, batch_size=10)

    # We mock DNS: first email fails, second email passes
    with patch(
        DNS_MOCK_PATH,
        side_effect=[
            {"is_valid": False, "reason": "NO_MX"},  # ID 101
            {"is_valid": True, "reason": "OK"},  # ID 102
        ],
    ):
        summary = await job.run_once(1)

    # ASSERTIONS: Only the dead-dns email (ID 101) should be in the unsub list
    assert client.unsubscribed_ids == [101]
    assert summary[4] == 1  # unsubscribed_count should be 1


async def test_watermark_not_advanced_on_failure(db_url):
    store = WatermarkStore(db_url)
    initial = "2024-01-01T00:00:00Z"
    store.update_successful_run(
        list_id=1,
        last_successful_created_at=initial,
        last_run_at=initial,
        processed_count=0,
        unsubscribed_count=0,
    )

    client = FakeListmonkClient([], fail_on_fetch=True)
    job = ListmonkValidatorJob(client=client, store=store, batch_size=2)
    summary = await job.run_once(1)

    state = store.get_state(1)
    assert state.last_successful_created_at == initial
    assert summary[1] == initial
    assert summary[5] == 1


def test_ensure_list_on_conflict(db_url):
    store = WatermarkStore(db_url)
    store.ensure_list(42)
    store.ensure_list(42)
    engine = create_engine(db_url, future=True)
    with engine.begin() as conn:
        count = conn.execute(
            text("SELECT COUNT(*) FROM listmonk_watermark WHERE list_id = 42")
        ).scalar_one()
    assert count == 1

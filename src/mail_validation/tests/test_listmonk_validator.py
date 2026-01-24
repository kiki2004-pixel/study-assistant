from pathlib import Path

import pytest

from mail_validation.jobs.listmonk_validator import ListmonkValidatorJob
from mail_validation.services.listmonk_client import ListmonkSubscriber
from mail_validation.storage.watermark_store import WatermarkStore


class FakeListmonkClient:
    def __init__(self, pages, *, fail_on_fetch: bool = False) -> None:
        self._pages = pages
        self._fail_on_fetch = fail_on_fetch
        self.unsubscribed_ids = []

    async def fetch_subscribers(self, *, list_id: int, watermark: str, page: int, per_page: int):
        if self._fail_on_fetch:
            raise RuntimeError("boom")
        index = page - 1
        if index >= len(self._pages):
            return []
        return self._pages[index]

    async def bulk_unsubscribe(self, *, list_id: int, ids):
        self.unsubscribed_ids.extend(ids)
        return {"ok": True}


@pytest.mark.asyncio
async def test_watermark_not_advanced_on_failure(tmp_path: Path):
    db_path = tmp_path / "watermark.sqlite3"
    store = WatermarkStore(db_path)
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


@pytest.mark.asyncio
async def test_invalid_syntax_emails_unsubscribed(tmp_path: Path):
    db_path = tmp_path / "watermark.sqlite3"
    store = WatermarkStore(db_path)
    pages = [
        [
            ListmonkSubscriber(id=1, email="bad-email", created_at="2024-01-02T00:00:00Z"),
            ListmonkSubscriber(id=2, email="good@example.com", created_at="2024-01-02T00:01:00Z"),
        ]
    ]
    client = FakeListmonkClient(pages)
    job = ListmonkValidatorJob(client=client, store=store, batch_size=10)

    summary = await job.run_once(1)

    assert client.unsubscribed_ids == [1]
    assert summary[4] == 1


@pytest.mark.asyncio
async def test_valid_emails_not_unsubscribed(tmp_path: Path):
    db_path = tmp_path / "watermark.sqlite3"
    store = WatermarkStore(db_path)
    pages = [
        [
            ListmonkSubscriber(id=10, email="a@example.com", created_at="2024-01-03T00:00:00Z"),
            ListmonkSubscriber(id=11, email="b@example.com", created_at="2024-01-03T00:02:00Z"),
        ]
    ]
    client = FakeListmonkClient(pages)
    job = ListmonkValidatorJob(client=client, store=store, batch_size=10)

    summary = await job.run_once(1)

    assert client.unsubscribed_ids == []
    assert summary[4] == 0

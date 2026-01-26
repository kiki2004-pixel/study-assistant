from __future__ import annotations

import asyncio
import json
import logging
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Callable, Dict, Iterable, List, Optional, Sequence, Tuple

from celery import Celery
from mail_validation.services.listmonk_client import ListmonkClient
from mail_validation.services.validation_service import validate_email_internal
from mail_validation.settings import Settings, get_settings
from mail_validation.storage.watermark_store import WatermarkStore

logger = logging.getLogger(__name__)

DEFAULT_WATERMARK = "1970-01-01T00:00:00Z"
DEFAULT_BATCH_SIZE = 250
DEFAULT_RESTART_DELAY_SECONDS = 10


settings_for_celery = get_settings()
celery_app = Celery(
    "mail_validation.listmonk",
    broker=settings_for_celery.celery_broker_url,
    backend=settings_for_celery.celery_result_backend
    or settings_for_celery.celery_broker_url,
)
celery_app.conf.update(broker_connection_retry_on_startup=True)


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _parse_iso(ts: str) -> Optional[datetime]:
    try:
        if ts.endswith("Z"):
            return datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return datetime.fromisoformat(ts)
    except ValueError:
        return None


def _max_timestamp(current: str, candidate: str) -> str:
    current_dt = _parse_iso(current)
    candidate_dt = _parse_iso(candidate)
    if current_dt and candidate_dt:
        return candidate if candidate_dt > current_dt else current
    return max(current, candidate)


def _chunked(items: Iterable[int], size: int) -> Iterable[List[int]]:
    batch: List[int] = []
    for item in items:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


@dataclass(frozen=True)
class RunSummary:
    started_at: str
    finished_at: str
    watermark_before: Dict[int, str]
    watermark_after: Dict[int, str]
    fetched_count: int
    checked_count: int
    unsubscribed_count: int
    errors_count: int

    def as_dict(self) -> Dict[str, object]:
        return {
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "watermark_before": self.watermark_before,
            "watermark_after": self.watermark_after,
            "fetched_count": self.fetched_count,
            "checked_count": self.checked_count,
            "unsubscribed_count": self.unsubscribed_count,
            "errors_count": self.errors_count,
        }


class ListmonkValidatorJob:
    def __init__(
        self,
        *,
        client: ListmonkClient,
        store: WatermarkStore,
        batch_size: int = DEFAULT_BATCH_SIZE,
        validator: Callable[[str], Dict[str, object]] = validate_email_internal,
    ) -> None:
        self._client = client
        self._store = store
        self._batch_size = batch_size
        self._validator = validator

    async def run_once(self, list_id: int) -> Tuple[str, str, int, int, int, int]:
        state = self._store.get_state(list_id)
        watermark_before = state.last_successful_created_at or DEFAULT_WATERMARK
        watermark_after = watermark_before
        fetched_count = 0
        checked_count = 0
        unsubscribed_count = 0
        errors_count = 0

        try:
            page = 1
            while True:
                subscribers = await self._client.fetch_subscribers(
                    list_id=list_id,
                    watermark=watermark_before,
                    page=page,
                    per_page=self._batch_size,
                )
                if not subscribers:
                    break

                fetched_count += len(subscribers)
                checked_count += len(subscribers)
                invalid_ids = []

                for subscriber in subscribers:
                    result = self._validator(subscriber.email)
                    if not result.get("ok", False):
                        invalid_ids.append(subscriber.id)

                    watermark_after = _max_timestamp(
                        watermark_after, subscriber.created_at
                    )

                for batch in _chunked(invalid_ids, self._batch_size):
                    await self._client.bulk_unsubscribe(list_id=list_id, ids=batch)
                    unsubscribed_count += len(batch)

                page += 1

            finished_at = _utc_now_iso()
            self._store.update_successful_run(
                list_id=list_id,
                last_successful_created_at=watermark_after,
                last_run_at=finished_at,
                processed_count=checked_count,
                unsubscribed_count=unsubscribed_count,
            )
        except Exception:
            errors_count += 1
            finished_at = _utc_now_iso()
            self._store.record_run(
                list_id=list_id,
                last_run_at=finished_at,
                processed_count=checked_count,
                unsubscribed_count=unsubscribed_count,
            )
            watermark_after = watermark_before
            logger.exception("Listmonk validation run failed for list_id=%s", list_id)

        return (
            watermark_before,
            watermark_after,
            fetched_count,
            checked_count,
            unsubscribed_count,
            errors_count,
        )


def _resolve_db_url(settings: Settings) -> str:
    if settings.watermark_db_url:
        return settings.watermark_db_url
    raise ValueError("WATERMARK_DB_URL is required")


def _parse_list_ids(raw: str) -> Optional[Sequence[int]]:
    if not raw:
        return None
    ids: List[int] = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            ids.append(int(part))
        except ValueError as exc:
            raise ValueError(
                "LISTMONK_LIST_ID must be integer or comma-separated integers"
            ) from exc
    return ids or None


def _excluded_name_substrings(settings: Settings) -> List[str]:
    raw = settings.listmonk_exclude_name_substrings or ""
    return [part.strip().lower() for part in raw.split(",") if part.strip()]


def _filter_lists(lists: Sequence[object], exclude_substrings: Sequence[str]):
    included = []
    excluded = []
    for lst in lists:
        name = getattr(lst, "name", "")
        name_l = name.lower()
        if any(substr in name_l for substr in exclude_substrings):
            excluded.append(lst)
        else:
            included.append(lst)
    return included, excluded


async def _run_once(settings: Settings) -> RunSummary:
    store = WatermarkStore(_resolve_db_url(settings))
    batch_size = settings.validation_batch_size or DEFAULT_BATCH_SIZE
    if batch_size <= 0:
        batch_size = DEFAULT_BATCH_SIZE
    list_ids = _parse_list_ids(str(settings.listmonk_list_id or ""))
    exclude_substrings = _excluded_name_substrings(settings)
    async with ListmonkClient(
        base_url=str(settings.listmonk_url),
        username=str(settings.listmonk_user or ""),
        password=str(settings.listmonk_pass or ""),
        api_user=str(settings.listmonk_api_user or "") or None,
        api_token=str(settings.listmonk_api_token or "") or None,
    ) as client:
        lists = await client.fetch_lists()
        if list_ids:
            lists = [lst for lst in lists if lst.id in list_ids]
        included, excluded = _filter_lists(lists, exclude_substrings)
        logger.info(
            "Listmonk lists included=%s excluded=%s",
            [(lst.id, lst.name) for lst in included],
            [(lst.id, lst.name) for lst in excluded],
        )
        for lst in included:
            store.ensure_list(lst.id)
        job = ListmonkValidatorJob(client=client, store=store, batch_size=batch_size)
        started_at = _utc_now_iso()
        fetched_count = 0
        checked_count = 0
        unsubscribed_count = 0
        errors_count = 0
        watermark_before: Dict[int, str] = {}
        watermark_after: Dict[int, str] = {}
        for lst in included:
            (
                wm_before,
                wm_after,
                fetched,
                checked,
                unsubscribed,
                errors,
            ) = await job.run_once(lst.id)
            watermark_before[lst.id] = wm_before
            watermark_after[lst.id] = wm_after
            fetched_count += fetched
            checked_count += checked
            unsubscribed_count += unsubscribed
            errors_count += errors
        finished_at = _utc_now_iso()
        summary = RunSummary(
            started_at=started_at,
            finished_at=finished_at,
            watermark_before=watermark_before,
            watermark_after=watermark_after,
            fetched_count=fetched_count,
            checked_count=checked_count,
            unsubscribed_count=unsubscribed_count,
            errors_count=errors_count,
        )
    return summary


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    settings = get_settings()
    poll_interval = settings.validation_poll_interval_seconds
    while True:
        summary = await _run_once(settings)
        logger.info("Listmonk validation summary: %s", summary.as_dict())
        print(json.dumps(summary.as_dict()))
        if poll_interval <= 0:
            if summary.errors_count > 0:
                raise SystemExit(1)
            return
        await asyncio.sleep(poll_interval)


if __name__ == "__main__":
    asyncio.run(main())


@celery_app.task(name="mail_validation.listmonk.run_cycle", bind=True)
def run_cycle(self) -> Dict[str, object]:
    logging.basicConfig(level=logging.INFO)
    settings = get_settings()
    summary = asyncio.run(_run_once(settings))
    logger.info("Listmonk validation summary: %s", summary.as_dict())
    interval = settings.validation_poll_interval_seconds or 0
    delay = max(settings.celery_restart_delay_seconds, interval)
    self.apply_async(countdown=delay)
    return summary.as_dict()

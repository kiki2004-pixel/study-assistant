from __future__ import annotations

from datetime import datetime
from typing import Optional

from scrub.dto.history import DeleteHistoryResponse, HistoryEntry, HistoryPage
from scrub.models.history_store import HistoryRecord, HistoryStore  # noqa: F401 — HistoryRecord re-exported
from scrub.settings import settings


def _to_entry(r: HistoryRecord) -> HistoryEntry:
    """Convert a raw HistoryRecord dataclass into a HistoryEntry DTO."""
    return HistoryEntry(
        id=r.id,
        email=r.email,
        validated_at=r.validated_at,
        is_valid=r.is_valid,
        quality_score=r.quality_score,
        checks=r.checks,
        attributes=r.attributes,
        request_id=r.request_id,
        user_id=r.user_id,
    )


class HistoryRepository:
    def __init__(self, db_url: str) -> None:
        self._store = HistoryStore(db_url)

    def save(
        self,
        *,
        email: str,
        is_valid: bool,
        quality_score: Optional[int] = None,
        checks: Optional[dict] = None,
        attributes: Optional[dict] = None,
        request_id: Optional[str] = None,
        user_id: Optional[str] = None,
        validated_at: Optional[datetime] = None,
    ) -> None:
        """Persist a single validation result. Called as a background task after single-email validation."""
        self._store.save(
            email=email,
            is_valid=is_valid,
            quality_score=quality_score,
            checks=checks,
            attributes=attributes,
            request_id=request_id,
            user_id=user_id,
            validated_at=validated_at,
        )

    def save_many(self, entries: list[dict]) -> None:
        """Batch-insert validation results in a single transaction. Called as a background task after bulk validation."""
        self._store.save_many(entries)

    def get_page(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 100,
        is_valid: Optional[bool] = None,
    ) -> HistoryPage:
        """Return a paginated page of validation history for a user, newest first.

        Optionally filtered by is_valid. Returns a HistoryPage with total count for pagination.
        """
        records, total = self._store.get_history(
            user_id=user_id, page=page, page_size=page_size, is_valid=is_valid
        )
        return HistoryPage(
            total=total,
            page=page,
            page_size=page_size,
            results=[_to_entry(r) for r in records],
        )

    def count_by_request_id(self, request_id: str, user_id: str) -> int:
        """Return the count of validated emails for a bulk job."""
        return self._store.count_by_request_id(request_id=request_id, user_id=user_id)

    def get_by_request_id(self, request_id: str, user_id: str) -> list[HistoryEntry]:
        """Return all validation results from a bulk job, ordered oldest first.

        Scoped to the user — returns an empty list if the request_id belongs to another user.
        """
        records = self._store.get_by_request_id(request_id=request_id, user_id=user_id)
        return [_to_entry(r) for r in records]

    def get_by_email(self, email: str, user_id: str) -> list[HistoryEntry]:
        """Return all validation history for a specific email address scoped to the user, newest first."""
        records = self._store.get_by_email(email=email, user_id=user_id)
        return [_to_entry(r) for r in records]

    def delete_by_email(self, email: str, user_id: str) -> DeleteHistoryResponse:
        """Delete all history for an email address owned by the user (GDPR right-to-erasure).

        Returns a DeleteHistoryResponse with the count of rows removed.
        """
        deleted = self._store.delete_by_email(email=email, user_id=user_id)
        return DeleteHistoryResponse(email=email, deleted=deleted)


def get_history_repository() -> HistoryRepository:
    """FastAPI dependency factory — returns a new HistoryRepository bound to the configured DB."""
    return HistoryRepository(settings.scrub_db_url)

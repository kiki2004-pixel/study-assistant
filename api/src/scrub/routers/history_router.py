from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from scrub.models.history import DeleteHistoryResponse, HistoryEntry, HistoryPage
from scrub.storage.history_store import HistoryRecord, HistoryStore
from scrub.settings import settings

router = APIRouter()


def get_history_store() -> HistoryStore:
    return HistoryStore(settings.watermark_db_url)


def _to_entry(r: HistoryRecord) -> HistoryEntry:
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


@router.get("", response_model=HistoryPage)
async def list_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
    is_valid: Optional[bool] = Query(None),
    email: Optional[str] = Query(None),
    request_id: Optional[str] = Query(None),
    store: HistoryStore = Depends(get_history_store),
):
    """Return paginated validation history, newest first."""
    records, total = store.get_history(
        page=page,
        page_size=page_size,
        is_valid=is_valid,
        email=email,
        request_id=request_id,
    )
    return HistoryPage(
        total=total,
        page=page,
        page_size=page_size,
        results=[_to_entry(r) for r in records],
    )


@router.get("/bulk/{request_id}", response_model=list[HistoryEntry])
async def get_bulk_history(
    request_id: str,
    store: HistoryStore = Depends(get_history_store),
):
    """Return all validation results for a bulk job."""
    records = store.get_by_request_id(request_id)
    if not records:
        raise HTTPException(status_code=404, detail="No history found for this request_id")
    return [_to_entry(r) for r in records]


@router.get("/{email}", response_model=list[HistoryEntry])
async def get_email_history(
    email: str,
    store: HistoryStore = Depends(get_history_store),
):
    """Return validation history for a specific email address."""
    records = store.get_by_email(email)
    if not records:
        raise HTTPException(status_code=404, detail="No history found for this email")
    return [_to_entry(r) for r in records]


@router.delete("/{email}", response_model=DeleteHistoryResponse)
async def delete_email_history(
    email: str,
    store: HistoryStore = Depends(get_history_store),
):
    """Delete all history for an email address (GDPR right-to-erasure)."""
    deleted = store.delete_by_email(email)
    return DeleteHistoryResponse(email=email, deleted=deleted)

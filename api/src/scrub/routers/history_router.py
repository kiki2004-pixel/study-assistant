from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from scrub.auth import verify_api_key
from scrub.dto.history import DeleteHistoryResponse, HistoryEntry, HistoryPage
from scrub.repositories.history_repository import (
    HistoryRepository,
    get_history_repository,
)

router = APIRouter()


@router.get("", response_model=HistoryPage)
async def list_history(
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=1000),
    is_valid: Optional[bool] = Query(None),
    repo: HistoryRepository = Depends(get_history_repository),
    caller: dict = Depends(verify_api_key),

):
    """Return paginated validation history for the authenticated user, newest first."""
    return repo.get_page(caller["sub"], page, page_size, is_valid)


@router.get("/bulk/{request_id}", response_model=list[HistoryEntry])
async def get_bulk_history(
    request_id: str,
    repo: HistoryRepository = Depends(get_history_repository),
    caller: dict = Depends(verify_api_key),

):
    """Return all validation results for a bulk job owned by the authenticated user."""
    records = repo.get_by_request_id(request_id, caller["sub"])
    if not records:
        raise HTTPException(
            status_code=404, detail="No history found for this request_id"
        )
    return records


@router.get("/{email}", response_model=list[HistoryEntry])
async def get_email_history(
    email: str,
    repo: HistoryRepository = Depends(get_history_repository),
    caller: dict = Depends(verify_api_key),

):
    """Return validation history for a specific email address owned by the authenticated user."""
    records = repo.get_by_email(email, caller["sub"])
    if not records:
        raise HTTPException(status_code=404, detail="No history found for this email")
    return records


@router.delete("/{email}", response_model=DeleteHistoryResponse)
async def delete_email_history(
    email: str,
    repo: HistoryRepository = Depends(get_history_repository),
    caller: dict = Depends(verify_api_key),

):
    """Delete history for an email address (GDPR right-to-erasure). Scoped to authenticated user."""
    return repo.delete_by_email(email, caller["sub"])

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel


class HistoryEntry(BaseModel):
    id: str
    email: str
    validated_at: datetime
    is_valid: bool
    quality_score: Optional[int] = None
    checks: Optional[dict[str, Any]] = None
    attributes: Optional[dict[str, Any]] = None
    request_id: Optional[str] = None
    user_id: Optional[str] = None


class HistoryPage(BaseModel):
    total: int
    page: int
    page_size: int
    results: list[HistoryEntry]


class DeleteHistoryResponse(BaseModel):
    email: str
    deleted: int

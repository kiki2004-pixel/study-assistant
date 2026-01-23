from __future__ import annotations

from pydantic import BaseModel, Field
from typing import Any, Dict, Literal, Optional


class BulkValidationRequest(BaseModel):
    emails: list[str] = Field(..., min_length=1, max_length=30_000)


    response_mode: Literal["all", "invalid_only", "summary_only"] = "all"

    dedupe: bool = False


class BulkEmailResult(BaseModel):
    email: str
    valid: bool
    status: str  
    reason: Optional[str] = None
    layer: Optional[str] = None
    details: Dict[str, Any] = Field(default_factory=dict)


class BulkValidationSummary(BaseModel):
    total: int
    processed: int
    valid: int
    invalid: int
    errors: int
    deduped: bool
    duplicates_removed: int
    duration_ms: int


class BulkValidationResponse(BaseModel):
    summary: BulkValidationSummary
    results: Optional[list[BulkEmailResult]] = None


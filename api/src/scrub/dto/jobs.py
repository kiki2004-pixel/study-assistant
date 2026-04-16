from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class JobProgressResponse(BaseModel):
    """Response model for job progress."""

    request_id: str
    status: str
    total_items: int
    processed_items: int
    valid_count: int
    invalid_count: int
    error_count: int
    progress_percentage: int
    is_complete: bool
    error_message: Optional[str] = None


class ActiveJobItem(BaseModel):
    """Item in active jobs list."""

    request_id: str
    job_type: str
    status: str
    list_name: Optional[str]
    total_items: int
    processed_items: int
    progress_percentage: int
    created_at: datetime

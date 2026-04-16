from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from scrub.models.validation_job_store import (
    JobSource,
    JobStatus,
    JobType,
    ValidationJob,
    ValidationJobStore,
)
from scrub.settings import settings


@dataclass
class JobProgress:
    """DTO for job progress response."""

    request_id: str
    status: str
    total_items: int
    processed_items: int
    valid_count: int
    invalid_count: int
    error_count: int
    progress_percentage: int
    is_complete: bool
    error_message: str | None = None


@dataclass
class ActiveJobSummary:
    """DTO for active job summary."""

    request_id: str
    job_type: str
    status: str
    list_name: str | None
    total_items: int
    processed_items: int
    progress_percentage: int
    created_at: datetime


class ValidationJobRepository:
    """Repository for validation job operations with business logic."""

    def __init__(self, db_url: str) -> None:
        self._store = ValidationJobStore(db_url)

    def create_job(
        self,
        *,
        request_id: str,
        user_id: str,
        job_type: JobType,
        source: JobSource,
        integration_id: Optional[int] = None,
        integration_type: Optional[str] = None,
        list_id: Optional[int] = None,
        list_name: Optional[str] = None,
        target_url: Optional[str] = None,
        total_items: int = 0,
        job_metadata: Optional[dict] = None,
    ) -> ValidationJob:
        """Create a new validation job."""
        return self._store.create(
            request_id=request_id,
            user_id=user_id,
            job_type=job_type,
            source=source,
            integration_id=integration_id,
            integration_type=integration_type,
            list_id=list_id,
            list_name=list_name,
            target_url=target_url,
            total_items=total_items,
            job_metadata=job_metadata,
        )

    def get_job(self, request_id: str, user_id: str) -> ValidationJob | None:
        """Get a job by request_id, scoped to user."""
        return self._store.get_by_request_id(request_id, user_id)

    def get_progress(self, request_id: str, user_id: str) -> JobProgress | None:
        """Get progress for a specific job."""
        job = self._store.get_by_request_id(request_id, user_id)
        if not job:
            return None

        pct = 0
        if job.total_items > 0:
            pct = min(int((job.processed_items / job.total_items) * 100), 100)

        return JobProgress(
            request_id=job.request_id,
            status=job.status.value,
            total_items=job.total_items,
            processed_items=job.processed_items,
            valid_count=job.valid_count,
            invalid_count=job.invalid_count,
            error_count=job.error_count,
            progress_percentage=pct,
            is_complete=job.status
            in (JobStatus.COMPLETED, JobStatus.FAILED, JobStatus.CANCELLED),
            error_message=job.error_message,
        )

    def list_active_jobs(self, user_id: str) -> list[ActiveJobSummary]:
        """List all active (pending/running) jobs for a user."""
        jobs = self._store.list_active_for_user(user_id)
        return [
            ActiveJobSummary(
                request_id=j.request_id,
                job_type=j.job_type.value,
                status=j.status.value,
                list_name=j.list_name,
                total_items=j.total_items,
                processed_items=j.processed_items,
                progress_percentage=min(
                    int((j.processed_items / j.total_items) * 100), 100
                )
                if j.total_items > 0
                else 0,
                created_at=j.created_at,
            )
            for j in jobs
        ]

    def start_job(self, request_id: str) -> None:
        """Mark a job as started."""
        self._store.start_job(request_id)

    def update_progress(
        self,
        request_id: str,
        processed_items: int,
        valid_count: int,
        invalid_count: int,
        error_count: int = 0,
    ) -> None:
        """Update job progress."""
        self._store.update_progress(
            request_id=request_id,
            processed_items=processed_items,
            valid_count=valid_count,
            invalid_count=invalid_count,
            error_count=error_count,
        )

    def complete_job(
        self,
        request_id: str,
        processed_items: int,
        valid_count: int,
        invalid_count: int,
        error_count: int = 0,
    ) -> None:
        """Mark a job as completed."""
        self._store.complete_job(
            request_id=request_id,
            processed_items=processed_items,
            valid_count=valid_count,
            invalid_count=invalid_count,
            error_count=error_count,
        )

    def fail_job(self, request_id: str, error_message: str) -> None:
        """Mark a job as failed."""
        self._store.fail_job(request_id, error_message)

    def get_active_request_ids_by_list(
        self, user_id: str, integration_id: int
    ) -> dict[int, str]:
        """Returns {list_id: request_id} for active jobs on an integration. Used to enrich list responses."""
        jobs = self._store.list_active_by_integration(user_id, integration_id)
        return {j.list_id: j.request_id for j in jobs if j.list_id is not None}

    def list_recent_jobs(
        self,
        user_id: str,
        limit: int = 50,
    ) -> list[ValidationJob]:
        """List recent jobs for a user (all statuses)."""
        return self._store.list_for_user(user_id, limit=limit)


def get_validation_job_repository() -> ValidationJobRepository:
    """Factory for FastAPI dependency injection."""
    return ValidationJobRepository(settings.scrub_db_url)

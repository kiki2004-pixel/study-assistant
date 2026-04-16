from fastapi import APIRouter, Depends, HTTPException

from scrub.auth import verify_token
from scrub.repositories.validation_job_repository import (
    ValidationJobRepository,
    get_validation_job_repository,
)
from scrub.dto.jobs import ActiveJobItem, JobProgressResponse

router = APIRouter()


@router.get("/progress/{request_id}", response_model=JobProgressResponse)
async def get_job_progress(
    request_id: str,
    claims: dict = Depends(verify_token),
    job_repo: ValidationJobRepository = Depends(get_validation_job_repository),
):
    """Get progress for a specific validation job by request_id."""
    progress = job_repo.get_progress(request_id, claims["sub"])
    if not progress:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobProgressResponse(
        request_id=progress.request_id,
        status=progress.status,
        total_items=progress.total_items,
        processed_items=progress.processed_items,
        valid_count=progress.valid_count,
        invalid_count=progress.invalid_count,
        error_count=progress.error_count,
        progress_percentage=progress.progress_percentage,
        is_complete=progress.is_complete,
        error_message=progress.error_message,
    )


@router.get("/active", response_model=list[ActiveJobItem])
async def list_active_jobs(
    claims: dict = Depends(verify_token),
    job_repo: ValidationJobRepository = Depends(get_validation_job_repository),
):
    """List all active (pending/running) validation jobs for the current user."""
    jobs = job_repo.list_active_jobs(claims["sub"])
    return [
        ActiveJobItem(
            request_id=j.request_id,
            job_type=j.job_type,
            status=j.status,
            list_name=j.list_name,
            total_items=j.total_items,
            processed_items=j.processed_items,
            progress_percentage=j.progress_percentage,
            created_at=j.created_at,
        )
        for j in jobs
    ]


@router.get("/recent", response_model=list[ActiveJobItem])
async def list_recent_jobs(
    claims: dict = Depends(verify_token),
    job_repo: ValidationJobRepository = Depends(get_validation_job_repository),
    limit: int = 50,
):
    """List recent validation jobs (completed and active) for the current user."""
    jobs = job_repo.list_recent_jobs(claims["sub"], limit=limit)
    return [
        ActiveJobItem(
            request_id=j.request_id,
            job_type=j.job_type.value,
            status=j.status.value,
            list_name=j.list_name,
            total_items=j.total_items,
            processed_items=j.processed_items,
            progress_percentage=min(int((j.processed_items / j.total_items) * 100), 100)
            if j.total_items > 0
            else 0,
            created_at=j.created_at,
        )
        for j in jobs
    ]

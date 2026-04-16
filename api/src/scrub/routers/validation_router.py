from fastapi import APIRouter, BackgroundTasks, Depends, Query
from functools import lru_cache
from pydantic import EmailStr
import uuid

from scrub.auth import verify_any_auth
from scrub.services import validation_orchestrator
from scrub.services.webhook_service import dispatch_webhook
from scrub.repositories.history_repository import (
    HistoryRepository,
    get_history_repository,
)
from scrub.repositories.user_repository import UserRepository, get_user_repository
from scrub.repositories.webhook_repository import (
    WebhookRepository,
    get_webhook_repository,
)
from scrub.dto.validation import ValidationResponse
from scrub.dto.bulk_validation import BulkValidationRequest, BulkValidationResponse
from scrub.models.validation_job_store import JobSource, JobType, ValidationJobStore
from scrub.settings import Settings
from sqlalchemy.pool import NullPool

router = APIRouter()


@lru_cache
def _get_user_repository() -> UserRepository:
    return get_user_repository()


@router.post("/validate-single", response_model=ValidationResponse)
async def validate_single(
    background_tasks: BackgroundTasks,
    email: EmailStr = Query(..., description="The email address to verify"),
    webhook_repo: WebhookRepository = Depends(get_webhook_repository),
    history_repo: HistoryRepository = Depends(get_history_repository),
    user_claims: dict = Depends(verify_any_auth),
    user_repo: UserRepository = Depends(_get_user_repository),
):
    """Validate a single email address using syntax and async DNS layers."""
    result = await validation_orchestrator.validate_single(
        email, user_claims.get("sub")
    )
    background_tasks.add_task(history_repo.save, **result.history_entry)
    background_tasks.add_task(dispatch_webhook, webhook_repo, result.webhook_payload)
    background_tasks.add_task(user_repo.record_usage, user_claims, 1)
    return result.response


@router.post("/validate-bulk", response_model=BulkValidationResponse)
async def validate_bulk(
    background_tasks: BackgroundTasks,
    payload: BulkValidationRequest,
    webhook_repo: WebhookRepository = Depends(get_webhook_repository),
    history_repo: HistoryRepository = Depends(get_history_repository),
    user_claims: dict = Depends(verify_any_auth),
    user_repo: UserRepository = Depends(_get_user_repository),
):
    """Validate up to 30,000 emails in a single request."""
    result = await validation_orchestrator.validate_bulk(
        payload, user_claims.get("sub")
    )

    # Create job record for tracking (bulk completes synchronously but we track it)
    settings = Settings()
    request_id = str(uuid.uuid4())

    # Override request_id in history entries and summary
    for entry in result.history_entries:
        entry["request_id"] = request_id

    # Create job record
    job_store = ValidationJobStore(settings.scrub_db_url, poolclass=NullPool)
    job_store.create(
        request_id=request_id,
        user_id=user_claims.get("sub"),
        job_type=JobType.BULK_API,
        source=JobSource.API,
        total_items=len(payload.emails) if payload.emails else 0,
        job_metadata={
            "processed": result.processed,
            "duplicates_removed": getattr(
                result.bulk_response.summary, "duplicates_removed", 0
            ),
        },
    )

    # Mark as completed immediately (synchronous)
    job_store.complete_job(
        request_id=request_id,
        processed_items=result.processed,
        valid_count=result.bulk_response.summary.valid,
        invalid_count=result.bulk_response.summary.invalid,
        error_count=result.bulk_response.summary.errors,
    )

    background_tasks.add_task(history_repo.save_many, result.history_entries)
    background_tasks.add_task(user_repo.record_usage, user_claims, result.processed)
    if result.webhook_payload:
        background_tasks.add_task(
            dispatch_webhook, webhook_repo, result.webhook_payload
        )
    return result.bulk_response

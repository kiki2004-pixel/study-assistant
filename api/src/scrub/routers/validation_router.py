from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query
from pydantic import EmailStr
from time import perf_counter
from prometheus_client import Counter, Histogram
import logging
import uuid

from scrub.services.validation_service import validate_email_internal
from scrub.services.webhook_service import dispatch_webhook
from scrub.storage.webhook_store import WebhookStore
from scrub.storage.history_store import HistoryStore
from scrub.routers.history_router import get_history_store
from scrub.models.validation import ValidationResponse
from scrub.models.bulk_validation import (
    BulkValidationRequest,
    BulkValidationResponse,
    BulkEmailResult,
    BulkValidationSummary,
)
from scrub.settings import settings
import scrub.jobs.celery_app as celery_app

logger = logging.getLogger(__name__)


def get_webhook_store() -> WebhookStore:
    return WebhookStore(settings.watermark_db_url)



router = APIRouter()

# Prometheus Metrics

VALIDATION_COUNTER = Counter(
    "scrub_emails_total",
    "Total number of emails validated",
    ["endpoint", "status", "layer"],
    # endpoint: "single" | "bulk"
    # status:   "deliverable" | "undeliverable" | "error"
    # layer:    "syntax" | "dns" | "internal"
)

VALIDATION_DURATION = Histogram(
    "scrub_duration_seconds",
    "Time spent validating emails",
    ["endpoint"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
)

BULK_SIZE_HISTOGRAM = Histogram(
    "scrub_bulk_size",
    "Number of emails submitted per bulk request",
    buckets=[1, 10, 50, 100, 500, 1000, 5000, 10000, 30000],
)

DUPLICATES_REMOVED_COUNTER = Counter(
    "scrub_duplicates_removed_total",
    "Total number of duplicate emails removed during bulk validation",
)


# Routes


@router.get("/trigger")
async def trigger_validation():
    celery_app.start_scheduler.delay()
    return {"message": "Scheduler started"}


@router.post("/validate-single", response_model=ValidationResponse)
async def validate_single(
    background_tasks: BackgroundTasks,
    email: EmailStr = Query(..., description="The email address to verify"),
    webhook_store: WebhookStore = Depends(get_webhook_store),
    history_store: HistoryStore = Depends(get_history_store),
):
    """
    Validate a single email address using syntax and async DNS layers.
    """
    with VALIDATION_DURATION.labels(endpoint="single").time():
        result = await validate_email_internal(email)

    layer = result.get("layer", "dns")
    status = result.get("status", "undeliverable")

    VALIDATION_COUNTER.labels(endpoint="single", status=status, layer=layer).inc()

    response = {
        "email": email,
        "status": status,
        "reason": result["reason"],
        "details": result["details"],
        "checks": result["checks"],
        "attributes": result["attributes"],
        "quality_score": result["quality_score"],
    }

    # Persist to history (non-blocking)
    background_tasks.add_task(
        history_store.save,
        email=email,
        is_valid=result["ok"],
        quality_score=result.get("quality_score"),
        checks=result.get("checks"),
        attributes=result.get("attributes"),
    )

    # Fire webhook after response is sent — FastAPI BackgroundTasks manages
    # execution safely, unlike asyncio.create_task() which is unbounded
    background_tasks.add_task(
        dispatch_webhook,
        webhook_store,
        {
            "endpoint": "single",
            "job_id": None,
            "summary": {
                "total": 1,
                "valid": 1 if result["ok"] else 0,
                "invalid": 0 if result["ok"] else 1,
            },
            "result": response,
        },
    )

    return response


@router.post("/validate-bulk", response_model=BulkValidationResponse)
async def validate_bulk(
    background_tasks: BackgroundTasks,
    payload: BulkValidationRequest,
    webhook_store: WebhookStore = Depends(get_webhook_store),
    history_store: HistoryStore = Depends(get_history_store),
):
    """
    Validates up to 30,000 emails in a single request.
    Leverages async concurrency for high-performance DNS lookups.
    """
    start_time = perf_counter()
    request_id = str(uuid.uuid4())

    emails = payload.emails or []
    duplicates_removed = 0

    BULK_SIZE_HISTOGRAM.observe(len(emails))

    if payload.dedupe:
        seen = set()
        deduped = []
        for e in emails:
            normalized = e.lower()
            if normalized in seen:
                duplicates_removed += 1
                continue
            seen.add(normalized)
            deduped.append(e)
        emails = deduped
        DUPLICATES_REMOVED_COUNTER.inc(duplicates_removed)

    total = len(payload.emails)
    processed = len(emails)

    results: list[BulkEmailResult] = []
    history_entries: list[dict] = []
    valid_count = 0
    invalid_count = 0
    error_count = 0

    with VALIDATION_DURATION.labels(endpoint="bulk").time():
        for email in emails:
            try:
                r = await validate_email_internal(email)
            except Exception:
                error_count += 1
                VALIDATION_COUNTER.labels(
                    endpoint="bulk", status="error", layer="internal"
                ).inc()
                logger.exception("Unexpected error validating email=%r", email)
                item = BulkEmailResult(
                    email=email,
                    valid=False,
                    status="error",
                    reason="internal_error",
                    layer="internal",
                    details={"message": "Unexpected validation error."},
                )
                history_entries.append({"email": email, "is_valid": False, "request_id": request_id})
                if payload.response_mode in ("all", "invalid_only"):
                    results.append(item)
                continue

            layer = r.get("layer", "dns")
            status = r.get("status", "undeliverable")

            if not r["ok"]:
                invalid_count += 1
                VALIDATION_COUNTER.labels(
                    endpoint="bulk", status=status, layer=layer
                ).inc()
                item = BulkEmailResult(
                    email=email,
                    valid=False,
                    status=status,
                    reason=r.get("reason"),
                    layer=layer,
                    details=r.get("details") or {},
                )
                history_entries.append({
                    "email": email,
                    "is_valid": False,
                    "quality_score": r.get("quality_score"),
                    "checks": r.get("checks"),
                    "attributes": r.get("attributes"),
                    "request_id": request_id,
                })
                if payload.response_mode in ("all", "invalid_only"):
                    results.append(item)
                continue

            valid_count += 1
            VALIDATION_COUNTER.labels(endpoint="bulk", status=status, layer=layer).inc()
            item = BulkEmailResult(
                email=email,
                valid=True,
                status=status,
                reason=r.get("reason"),
                layer=layer,
                details=r.get("details") or {},
            )
            history_entries.append({
                "email": email,
                "is_valid": True,
                "quality_score": r.get("quality_score"),
                "checks": r.get("checks"),
                "attributes": r.get("attributes"),
                "request_id": request_id,
            })
            if payload.response_mode == "all":
                results.append(item)

    duration_ms = int((perf_counter() - start_time) * 1000)

    summary = BulkValidationSummary(
        total=total,
        processed=processed,
        valid=valid_count,
        invalid=invalid_count,
        errors=error_count,
        deduped=payload.dedupe,
        duplicates_removed=duplicates_removed,
        duration_ms=duration_ms,
    )

    # Persist all results to history (non-blocking)
    background_tasks.add_task(history_store.save_many, history_entries)

    if payload.response_mode == "summary_only":
        return BulkValidationResponse(summary=summary, results=None)

    bulk_response = BulkValidationResponse(summary=summary, results=results)

    background_tasks.add_task(
        dispatch_webhook,
        webhook_store,
        {
            "endpoint": "bulk",
            "job_id": None,
            "summary": {
                "total": summary.total,
                "processed": summary.processed,
                "valid": summary.valid,
                "invalid": summary.invalid,
                "errors": summary.errors,
                "duplicates_removed": summary.duplicates_removed,
                "duration_ms": summary.duration_ms,
            },
        },
    )

    return bulk_response

from fastapi import APIRouter, HTTPException, Query
from time import perf_counter
from prometheus_client import Counter, Histogram
import logging

from mail_validation.services.validation_service import validate_email_internal
from mail_validation.models.validation import ValidationResponse
from mail_validation.models.bulk_validation import (
    BulkValidationRequest,
    BulkValidationResponse,
    BulkEmailResult,
    BulkValidationSummary,
)
import mail_validation.jobs.celery_app as celery_app

logger = logging.getLogger(__name__)
router = APIRouter()

VALIDATION_COUNTER = Counter(
    "mail_validation_emails_total",
    "Total number of emails validated",
    ["endpoint", "status", "layer"],
    # endpoint: "single" | "bulk"
    # status:   "deliverable" | "undeliverable" | "error"
    # layer:    "syntax" | "dns" | "internal"
)

VALIDATION_DURATION = Histogram(
    "mail_validation_duration_seconds",
    "Time spent validating emails",
    ["endpoint"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
)

BULK_SIZE_HISTOGRAM = Histogram(
    "mail_validation_bulk_size",
    "Number of emails submitted per bulk request",
    buckets=[1, 10, 50, 100, 500, 1000, 5000, 10000, 30000],
)

DUPLICATES_REMOVED_COUNTER = Counter(
    "mail_validation_duplicates_removed_total",
    "Total number of duplicate emails removed during bulk validation",
)

@router.get("/trigger")
async def trigger_validation():
    celery_app.start_scheduler.delay()
    return {"message": "Scheduler started"}


@router.post("/validate-single", response_model=ValidationResponse)
async def validate_single(
    email: str = Query(..., description="The email address to verify"),
):
    """
    Validate a single email address using syntax and async DNS layers.
    """
    with VALIDATION_DURATION.labels(endpoint="single").time():
        result = await validate_email_internal(email)

    layer = result.get("layer", "dns")
    status = result.get("status", "undeliverable")

    if not result["ok"] and layer == "syntax":
        VALIDATION_COUNTER.labels(
            endpoint="single", status="undeliverable", layer="syntax"
        ).inc()
        raise HTTPException(
            status_code=422,
            detail={
                "email": email,
                "valid": False,
                "reason": result["reason"],
                "message": result["details"].get("message", "Invalid syntax"),
                "layer": "syntax",
            },
        )

    VALIDATION_COUNTER.labels(
        endpoint="single", status=status, layer=layer
    ).inc()

    return {
        "email": email,
        "status": status,
        "reason": result["reason"],
        "details": result["details"],
    }


@router.post("/validate-bulk", response_model=BulkValidationResponse)
async def validate_bulk(payload: BulkValidationRequest):
    """
    Validates up to 30,000 emails in a single request.
    Leverages async concurrency for high-performance DNS lookups.
    """
    start_time = perf_counter()

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
                if payload.response_mode in ("all", "invalid_only"):
                    results.append(item)
                continue

            valid_count += 1
            VALIDATION_COUNTER.labels(
                endpoint="bulk", status=status, layer=layer
            ).inc()
            item = BulkEmailResult(
                email=email,
                valid=True,
                status=status,
                reason=r.get("reason"),
                layer=layer,
                details=r.get("details") or {},
            )
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

    if payload.response_mode == "summary_only":
        return BulkValidationResponse(summary=summary, results=None)

    return BulkValidationResponse(summary=summary, results=results)
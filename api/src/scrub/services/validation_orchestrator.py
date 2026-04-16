from __future__ import annotations

import logging
import uuid
from dataclasses import dataclass, field
from time import perf_counter

from prometheus_client import Counter, Histogram

from scrub.dto.bulk_validation import (
    BulkEmailResult,
    BulkValidationRequest,
    BulkValidationResponse,
    BulkValidationSummary,
)
from scrub.services.validation_service import validate_email_internal

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Prometheus metrics
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# Result containers
# ---------------------------------------------------------------------------


@dataclass
class SingleResult:
    """Output of validate_single — everything the router needs to respond and schedule tasks."""

    response: dict
    history_entry: dict
    webhook_payload: dict


@dataclass
class BulkResult:
    """Output of validate_bulk — everything the router needs to respond and schedule tasks."""

    bulk_response: BulkValidationResponse
    history_entries: list[dict]
    webhook_payload: dict | None  # None when response_mode is summary_only
    processed: int


# ---------------------------------------------------------------------------
# Orchestration logic
# ---------------------------------------------------------------------------


async def validate_single(email: str, user_id: str | None) -> SingleResult:
    """Run the single-email validation pipeline and return a structured result.

    Executes the core validation, records Prometheus metrics, and builds the
    history entry and webhook payload so the router only has to schedule tasks.
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

    history_entry = {
        "email": email,
        "is_valid": result["ok"],
        "quality_score": result.get("quality_score"),
        "checks": result.get("checks"),
        "attributes": result.get("attributes"),
        "user_id": user_id,
    }

    webhook_payload = {
        "endpoint": "single",
        "job_id": None,
        "summary": {
            "total": 1,
            "valid": 1 if result["ok"] else 0,
            "invalid": 0 if result["ok"] else 1,
        },
        "result": response,
    }

    return SingleResult(
        response=response, history_entry=history_entry, webhook_payload=webhook_payload
    )


async def validate_bulk(
    payload: BulkValidationRequest, user_id: str | None
) -> BulkResult:
    """Run the bulk validation pipeline and return a structured result.

    Handles deduplication, per-email validation, Prometheus metrics, and builds
    history entries and the webhook payload so the router only has to schedule tasks.
    """
    start_time = perf_counter()
    request_id = str(uuid.uuid4())

    emails = payload.emails or []
    duplicates_removed = 0

    BULK_SIZE_HISTOGRAM.observe(len(emails))

    if payload.dedupe:
        seen: set[str] = set()
        deduped: list[str] = []
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
                results.append(
                    BulkEmailResult(
                        email=email,
                        valid=False,
                        status="error",
                        reason="internal_error",
                        layer="internal",
                        details={"message": "Unexpected validation error."},
                    )
                )
                history_entries.append(
                    {
                        "email": email,
                        "is_valid": False,
                        "request_id": request_id,
                        "user_id": user_id,
                    }
                )
                continue

            layer = r.get("layer", "dns")
            status = r.get("status", "undeliverable")
            ok = r["ok"]

            VALIDATION_COUNTER.labels(endpoint="bulk", status=status, layer=layer).inc()

            item = BulkEmailResult(
                email=email,
                valid=ok,
                status=status,
                reason=r.get("reason"),
                layer=layer,
                details=r.get("details") or {},
            )
            history_entries.append(
                {
                    "email": email,
                    "is_valid": ok,
                    "quality_score": r.get("quality_score"),
                    "checks": r.get("checks"),
                    "attributes": r.get("attributes"),
                    "request_id": request_id,
                    "user_id": user_id,
                }
            )

            if ok:
                valid_count += 1
                if payload.response_mode == "all":
                    results.append(item)
            else:
                invalid_count += 1
                if payload.response_mode in ("all", "invalid_only"):
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
        request_id=request_id,
    )

    if payload.response_mode == "summary_only":
        return BulkResult(
            bulk_response=BulkValidationResponse(summary=summary, results=None),
            history_entries=history_entries,
            webhook_payload=None,
            processed=processed,
        )

    webhook_payload = {
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
            "request_id": summary.request_id,
        },
    }

    return BulkResult(
        bulk_response=BulkValidationResponse(summary=summary, results=results),
        history_entries=history_entries,
        webhook_payload=webhook_payload,
        processed=processed,
    )

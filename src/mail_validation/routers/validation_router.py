from fastapi import APIRouter, HTTPException, Query
from time import perf_counter
import asyncio
import logging

from mail_validation.services.validation_service import validate_email_internal
from mail_validation.models.validation import ValidationResponse
from mail_validation.models.bulk_validation import (
    BulkValidationRequest,
    BulkValidationResponse,
    BulkEmailResult,
    BulkValidationSummary,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/validate-single", response_model=ValidationResponse)
async def validate_only(
    email: str = Query(..., description="The email address to verify"),
):
    result = await asyncio.to_thread(validate_email_internal, email)

    if not result["ok"] and result.get("layer") == "syntax":
        raise HTTPException(
            status_code=422,
            detail={
                "email": email,
                "valid": False,
                "reason": result["reason"],
                "message": result["details"].get("message"),
                "layer": "syntax",
            },
        )

    return {
        "email": email,
        "status": result["status"],
        "reason": result["reason"],
        "details": result["details"],
    }


@router.post("/validate-bulk", response_model=BulkValidationResponse)
async def validate_bulk(payload: BulkValidationRequest):
    """
    Validates up to 30,000 emails in a single request.
    """
    start = perf_counter()

    emails = payload.emails

    duplicates_removed = 0
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

    total = len(payload.emails)
    processed = len(emails)

    results: list[BulkEmailResult] = []
    valid_count = 0
    invalid_count = 0
    error_count = 0

    for email in emails:
        try:
            r = await asyncio.to_thread(validate_email_internal, email)
        except Exception:
            error_count += 1
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

        if not r["ok"] and r.get("layer") == "syntax":
            invalid_count += 1
            item = BulkEmailResult(
                email=email,
                valid=False,
                status="undeliverable",
                reason=r.get("reason"),
                layer=r.get("layer"),
                details=r.get("details") or {},
            )
            if payload.response_mode in ("all", "invalid_only"):
                results.append(item)
            continue

        valid_count += 1
        item = BulkEmailResult(
            email=email,
            valid=True,
            status=r.get("status", "unknown"),
            reason=r.get("reason"),
            layer=r.get("layer"),
            details=r.get("details") or {},
        )
        if payload.response_mode == "all":
            results.append(item)

    duration_ms = int((perf_counter() - start) * 1000)

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

from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict

import httpx

from scrub.storage.webhook_store import WebhookStore

logger = logging.getLogger(__name__)

MAX_RETRIES = 3  # retries after the initial attempt = 4 total attempts
RETRY_DELAYS = [2, 5, 10]  # seconds between each retry


async def _deliver(
    client: httpx.AsyncClient,
    url: str,
    payload: bytes,
    signature: str,
) -> bool:
    """Attempt a single delivery. Returns True on success."""
    try:
        resp = await client.post(
            url,
            content=payload,
            headers={
                "Content-Type": "application/json",
                "X-Webhook-Signature-256": f"sha256={signature}",
                "X-Webhook-Event": "validation.completed",
            },
            timeout=10.0,
        )
        resp.raise_for_status()
        return True
    except (httpx.HTTPStatusError, httpx.RequestError) as exc:
        logger.warning("Webhook delivery failed url=%s error=%s", url, exc)
        return False


async def dispatch_webhook(store: WebhookStore, event_payload: Dict[str, Any]) -> None:
    """
    Dispatch a webhook event to all active registered URLs.
    Retries up to MAX_RETRIES times with backoff on failure.
    Deactivates webhook after MAX_FAILURES consecutive failures.
    """
    registrations = await asyncio.to_thread(store.list_active)
    if not registrations:
        return

    body = json.dumps(
        {
            "event": "validation.completed",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            **event_payload,
        }
    ).encode()

    async with httpx.AsyncClient() as client:
        for reg in registrations:
            signature = store.sign_payload(reg.secret, body)
            delivered = False

            for attempt in range(
                MAX_RETRIES + 1
            ):  # initial attempt + MAX_RETRIES retries
                delivered = await _deliver(client, reg.url, body, signature)
                if delivered:
                    await asyncio.to_thread(store.record_success, reg.id)
                    logger.info(
                        "Webhook delivered url=%s attempt=%d", reg.url, attempt + 1
                    )
                    break
                if attempt < MAX_RETRIES:
                    await asyncio.sleep(RETRY_DELAYS[attempt])

            if not delivered:
                store.record_failure(reg.id)
                logger.error(
                    "Webhook delivery failed after %d attempts url=%s — failure recorded",
                    MAX_RETRIES,
                    reg.url,
                )

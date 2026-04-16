from __future__ import annotations

from scrub.models.webhook_store import WebhookRegistration, WebhookStore
from scrub.settings import block_ssrf, settings


class WebhookRepository:
    def __init__(self, db_url: str) -> None:
        self._store = WebhookStore(db_url)

    def register(self, url: str) -> dict:
        """Register a webhook URL and return its secret.

        Validates the URL against SSRF rules before persisting. Uses an atomic upsert so
        re-registering an existing URL resets its failure count and rotates the secret.
        Returns a dict with url, secret, and a reminder message — the secret is shown once only.
        """
        block_ssrf(url)
        reg = self._store.register(url)
        return {
            "url": reg.url,
            "secret": reg.secret,
            "message": "Webhook registered. Save the secret — it will not be shown again.",
        }

    def deregister(self, url: str) -> bool:
        """Remove a webhook registration by URL. Returns False if the URL was not found."""
        return self._store.deregister(url)

    def list_active(self) -> list[dict]:
        """Return all active webhook registrations as response-ready dicts."""
        return [
            {
                "id": r.id,
                "url": r.url,
                "active": r.active,
                "failure_count": r.failure_count,
            }
            for r in self._store.list_active()
        ]

    def record_failure(self, webhook_id: int) -> None:
        """Increment the failure counter for a webhook. Deactivates it after MAX_FAILURES consecutive failures."""
        self._store.record_failure(webhook_id)

    def record_success(self, webhook_id: int) -> None:
        """Reset the failure counter for a webhook after a successful delivery."""
        self._store.record_success(webhook_id)

    def list_active_registrations(self) -> list[WebhookRegistration]:
        """Return raw WebhookRegistration objects for use by webhook_service during dispatch."""
        return self._store.list_active()

    @staticmethod
    def sign_payload(secret: str, body: bytes) -> str:
        """Generate an HMAC-SHA256 signature for a webhook payload body."""
        return WebhookStore.sign_payload(secret, body)


def get_webhook_repository() -> WebhookRepository:
    """FastAPI dependency factory — returns a new WebhookRepository bound to the configured DB."""
    return WebhookRepository(settings.scrub_db_url)

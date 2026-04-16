from __future__ import annotations

from scrub.models.integration_store import (
    Integration,
    IntegrationStore,
    IntegrationType,
)  # noqa: F401 — IntegrationType re-exported
from scrub.models.user_store import UserStore
from scrub.settings import settings


class IntegrationRepository:
    def __init__(self, db_url: str) -> None:
        self._integrations = IntegrationStore(db_url)
        self._users = UserStore(db_url)

    def _resolve_user(self, sub: str, email: str | None, name: str | None):
        """Upsert the user by their OIDC subject, returning the local User record."""
        return self._users.get_or_create(sub=sub, email=email, name=name)

    def _to_summary(self, i: Integration) -> dict:
        """Convert an Integration record to a response-ready summary dict."""
        return {
            "id": i.id,
            "url": i.config["url"],
            "username": i.config["username"],
            "created_at": i.created_at,
        }

    def list(self, sub: str, email: str | None, name: str | None) -> list[dict]:
        """Return all Listmonk integrations belonging to the authenticated user."""
        user = self._resolve_user(sub, email, name)
        integrations = self._integrations.list_by_type(
            user.id, IntegrationType.listmonk
        )
        return [self._to_summary(i) for i in integrations]

    def create(
        self, sub: str, email: str | None, name: str | None, config: dict
    ) -> dict:
        """Create a new Listmonk integration for the authenticated user and return its summary."""
        user = self._resolve_user(sub, email, name)
        integration = self._integrations.create(
            user.id, IntegrationType.listmonk, config
        )
        return self._to_summary(integration)

    def get_owned(
        self, integration_id: int, sub: str, email: str | None, name: str | None
    ) -> Integration | None:
        """Fetch an integration by ID and verify it belongs to the authenticated user.

        Returns None if the integration doesn't exist or belongs to a different user.
        Callers should raise HTTP 404 on None.
        """
        user = self._resolve_user(sub, email, name)
        integration = self._integrations.get_by_id(integration_id)
        if not integration or integration.user_id != user.id:
            return None
        return integration

    def update_owned(
        self,
        integration_id: int,
        sub: str,
        email: str | None,
        name: str | None,
        config: dict,
    ) -> dict | None:
        """Update the config of an integration owned by the authenticated user.

        Returns None if ownership check fails. Callers should raise HTTP 404 on None.
        """
        if not self.get_owned(integration_id, sub, email, name):
            return None
        integration = self._integrations.update(integration_id, config)
        return self._to_summary(integration) if integration else None

    def delete_owned(
        self, integration_id: int, sub: str, email: str | None, name: str | None
    ) -> bool:
        """Delete an integration owned by the authenticated user.

        Returns False if the integration doesn't exist or belongs to a different user.
        """
        if not self.get_owned(integration_id, sub, email, name):
            return False
        return self._integrations.delete_by_id(integration_id)


def get_integration_repository() -> IntegrationRepository:
    """FastAPI dependency factory — returns a new IntegrationRepository bound to the configured DB."""
    return IntegrationRepository(settings.scrub_db_url)

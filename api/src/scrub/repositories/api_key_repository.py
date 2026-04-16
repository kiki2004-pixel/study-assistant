from __future__ import annotations

from scrub.models.api_key_store import ApiKey, ApiKeyStore
from scrub.models.user_store import UserStore
from scrub.settings import settings


class ApiKeyRepository:
    def __init__(self, db_url: str) -> None:
        self._keys = ApiKeyStore(db_url)
        self._users = UserStore(db_url)

    def _resolve_user(self, sub: str, email: str | None, name: str | None):
        """Upsert the user by their OIDC subject, returning the local User record."""
        return self._users.get_or_create(sub=sub, email=email, name=name)

    def create(
        self, sub: str, email: str | None, name: str | None, key_name: str
    ) -> dict:
        """Generate a new API key for the authenticated user.

        Resolves the user from claims, then creates a hashed key record.
        Returns a dict with id, name, key (raw — shown once only), and created_at.
        """
        user = self._resolve_user(sub, email, name)
        key, raw = self._keys.create(user_id=user.id, name=key_name)
        return {
            "id": key.id,
            "name": key.name,
            "key": raw,
            "created_at": key.created_at,
        }

    def list(self, sub: str, email: str | None, name: str | None) -> list[dict]:
        """Return all API keys belonging to the authenticated user, newest first."""
        user = self._resolve_user(sub, email, name)
        keys = self._keys.list_for_user(user.id)
        return [
            {
                "id": k.id,
                "name": k.name,
                "created_at": k.created_at,
                "last_used_at": k.last_used_at,
                "active": k.active,
            }
            for k in keys
        ]

    def revoke(
        self, key_id: int, sub: str, email: str | None, name: str | None
    ) -> bool:
        """Deactivate an API key. Returns False if the key doesn't exist or isn't owned by the user."""
        user = self._resolve_user(sub, email, name)
        return self._keys.revoke(key_id=key_id, user_id=user.id)

    def lookup(self, raw: str) -> ApiKey | None:
        """Find an active key by its raw value and update last_used_at. Used by auth middleware."""
        return self._keys.lookup(raw)


def get_api_key_repository() -> ApiKeyRepository:
    """FastAPI dependency factory — returns a new ApiKeyRepository bound to the configured DB."""
    return ApiKeyRepository(settings.scrub_db_url)

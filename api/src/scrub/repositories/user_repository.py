from __future__ import annotations

import logging

from scrub.models.user_store import User, UserStats, UserStore
from scrub.settings import settings

logger = logging.getLogger(__name__)


class UserRepository:
    def __init__(self, db_url: str, **engine_kwargs) -> None:
        self._store = UserStore(db_url, **engine_kwargs)

    def get_or_create(self, sub: str, email: str | None, name: str | None) -> User:
        """Upsert a user by their OIDC subject, updating email and name on each login."""
        return self._store.get_or_create(sub=sub, email=email, name=name)

    def get_stats(self, user_id: int) -> UserStats:
        """Return total and current-month validation counts for a user."""
        return self._store.get_stats(user_id)

    def get_context(self, sub: str, email: str | None, name: str | None) -> dict:
        """Resolve user from claims and return their profile with usage stats.

        Combines get_or_create and get_stats into a single dict ready for the /context response.
        """
        user = self._store.get_or_create(sub=sub, email=email, name=name)
        stats = self._store.get_stats(user.id)
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "created_at": user.created_at,
            "stats": {
                "total_validations": stats.total_validations,
                "validations_this_month": stats.validations_this_month,
            },
        }

    def record_usage(self, claims: dict, count: int = 1) -> None:
        """Resolve user from claims and increment their monthly validation counter.

        Designed to be called as a background task — swallows all exceptions so
        a stats-write failure never surfaces to the caller.
        """
        try:
            user = self._store.get_or_create(
                claims["sub"], claims.get("email"), claims.get("name")
            )
            self._store.record_validation(user.id, count=count)
        except Exception:
            logger.exception("Failed to record usage for sub=%r", claims.get("sub"))


def get_user_repository() -> UserRepository:
    """FastAPI dependency factory — returns a new UserRepository bound to the configured DB."""
    return UserRepository(settings.scrub_db_url)

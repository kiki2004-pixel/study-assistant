from __future__ import annotations

import httpx
import listmonk
from listmonk.models import Subscriber


class ListmonkClient:
    """
    Thin wrapper around the `listmonk` package.
    Calls set_url_base + login before each operation so each task uses the
    correct per-user credentials.  Designed for use in Celery tasks (sync).
    """

    def __init__(self, base_url: str, username: str, api_token: str) -> None:
        self._base_url = base_url
        self._username = username
        self._api_token = api_token

    def _auth(self) -> None:
        listmonk.set_url_base(self._base_url)
        listmonk.login(self._username, self._api_token)

    # ------------------------------------------------------------------
    # Health
    # ------------------------------------------------------------------

    def is_healthy(self) -> bool:
        self._auth()
        return listmonk.is_healthy()

    def get_lists(self) -> list[dict]:
        self._auth()
        return listmonk.lists()

    # ------------------------------------------------------------------
    # Subscribers
    # ------------------------------------------------------------------

    def subscribers(self, list_id: int) -> list[Subscriber]:
        self._auth()
        return listmonk.subscribers(list_id=list_id)

    def subscriber_by_email(self, email: str) -> Subscriber | None:
        self._auth()
        return listmonk.subscriber_by_email(email)

    def subscriber_by_id(self, sub_id: int) -> Subscriber | None:
        self._auth()
        return listmonk.subscriber_by_id(sub_id)

    def subscribers_count(self, list_id: int | None = None) -> int:
        self._auth()
        subs = listmonk.subscribers(list_id=list_id) if list_id else []
        return len(subs)

    # ------------------------------------------------------------------
    # Block / unsubscribe
    # ------------------------------------------------------------------

    def block_subscriber(self, subscriber: Subscriber) -> None:
        self._auth()
        listmonk.block_subscriber(subscriber)

    def block_subscribers_by_ids(self, ids: list[int]) -> None:
        """Block multiple subscribers by ID (fetches each then blocks)."""
        self._auth()
        for sub_id in ids:
            sub = listmonk.subscriber_by_id(sub_id)
            if sub:
                listmonk.block_subscriber(sub)

    def unsubscribe_subscriber(self, email: str) -> None:
        self._auth()
        sub = listmonk.subscriber_by_email(email)
        if sub:
            listmonk.block_subscriber(sub)

    # ------------------------------------------------------------------
    # Paginated subscriber fetching (raw REST, supports pagination)
    # ------------------------------------------------------------------

    def subscribers_total(self, list_id: int) -> int:
        """Return total subscriber count for a list."""
        with httpx.Client(
            base_url=self._base_url,
            auth=(self._username, self._api_token),
            timeout=10.0,
        ) as client:
            resp = client.get(
                "/api/subscribers",
                params={"list_id": list_id, "page": 1, "per_page": 1},
            )
            resp.raise_for_status()
            return resp.json().get("data", {}).get("total", 0)

    def subscribers_page(
        self, list_id: int, page: int, per_page: int = 100
    ) -> list[dict]:
        """Fetch one page of subscribers for a list."""
        with httpx.Client(
            base_url=self._base_url,
            auth=(self._username, self._api_token),
            timeout=30.0,
        ) as client:
            resp = client.get(
                "/api/subscribers",
                params={"list_id": list_id, "page": page, "per_page": per_page},
            )
            resp.raise_for_status()
            return resp.json().get("data", {}).get("results", [])

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional

import httpx

DEFAULT_TIMEOUT_SECONDS = 15.0
DEFAULT_MAX_RETRIES = 3
HTTP_RETRY_STATUSES = {429, 500, 502, 503, 504}


class ListmonkError(RuntimeError):
    pass


@dataclass(frozen=True)
class ListmonkSubscriber:
    id: int
    email: str
    created_at: str


@dataclass(frozen=True)
class ListmonkList:
    id: int
    name: str


class ListmonkClient:
    def __init__(
        self,
        *,
        base_url: str,
        username: Optional[str] = None,
        password: Optional[str] = None,
        api_user: Optional[str] = None,
        api_token: Optional[str] = None,
        timeout_seconds: float = DEFAULT_TIMEOUT_SECONDS,
        max_retries: int = DEFAULT_MAX_RETRIES,
        client: Optional[httpx.AsyncClient] = None,
    ) -> None:
        if not base_url:
            raise ValueError("LISTMONK_BASE_URL is required")

        auth = None
        headers = {"Accept": "application/json"}
        if api_user and api_token:
            headers["Authorization"] = f"token {api_user}:{api_token}"
        else:
            if not username:
                raise ValueError("LISTMONK_USERNAME is required")
            if not password:
                raise ValueError("LISTMONK_PASSWORD is required")
            auth = httpx.BasicAuth(username, password)

        self._base_url = base_url.rstrip("/")
        self._timeout = httpx.Timeout(timeout_seconds)
        self._max_retries = max_retries
        self._client = client or httpx.AsyncClient(
            base_url=self._base_url,
            auth=auth,
            timeout=self._timeout,
            headers=headers,
        )
        self._owns_client = client is None

    async def __aenter__(self) -> "ListmonkClient":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> None:
        if self._owns_client:
            await self._client.aclose()

    async def fetch_subscribers(
        self,
        *,
        list_id: int,
        watermark: str,
        page: int,
        per_page: int,
    ) -> List[ListmonkSubscriber]:
        params = {
            "list_id": list_id,
            "order_by": "created_at",
            "order": "asc",
            "per_page": per_page,
            "page": page,
            "query": f"subscribers.created_at > '{watermark}'",
        }
        data = await self._request("GET", "/api/subscribers", params=params)
        results = self._extract_results(data)
        subscribers: List[ListmonkSubscriber] = []
        for item in results:
            if "id" not in item or "email" not in item or "created_at" not in item:
                continue
            subscribers.append(
                ListmonkSubscriber(
                    id=int(item["id"]),
                    email=str(item["email"]),
                    created_at=str(item["created_at"]),
                )
            )
        return subscribers

    async def fetch_lists(self) -> List[ListmonkList]:
        data = await self._request("GET", "/api/lists")
        results = self._extract_results(data)
        lists: List[ListmonkList] = []
        for item in results:
            if "id" not in item or "name" not in item:
                continue
            lists.append(ListmonkList(id=int(item["id"]), name=str(item["name"])))
        return lists

    async def bulk_unsubscribe(
        self, *, list_id: int, ids: Iterable[int]
    ) -> Dict[str, Any]:
        payload = {
            "action": "unsubscribe",
            "ids": list(ids),
            "target_list_ids": [list_id],
        }
        return await self._request("PUT", "/api/subscribers/lists", json=payload)

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        last_exc: Optional[Exception] = None
        for attempt in range(1, self._max_retries + 1):
            try:
                resp = await self._client.request(
                    method, path, params=params, json=json
                )
                if resp.status_code in HTTP_RETRY_STATUSES:
                    raise ListmonkError(
                        f"Listmonk transient error {resp.status_code}: {resp.text}"
                    )
                resp.raise_for_status()
                if not resp.content:
                    return {}
                try:
                    return resp.json()
                except ValueError:
                    return {"raw": resp.text}
            except httpx.HTTPStatusError as exc:
                last_exc = exc
                status = exc.response.status_code if exc.response else None
                if status not in HTTP_RETRY_STATUSES:
                    raise ListmonkError(
                        f"Listmonk request failed: {status} {exc.response.text}"
                    ) from exc
                if attempt >= self._max_retries:
                    break
                backoff = 0.5 * (2 ** (attempt - 1))
                await asyncio.sleep(backoff)
            except (httpx.RequestError, ListmonkError) as exc:
                last_exc = exc
                if attempt >= self._max_retries:
                    break
                backoff = 0.5 * (2 ** (attempt - 1))
                await asyncio.sleep(backoff)
        raise ListmonkError(
            f"Listmonk request failed after retries: {last_exc}"
        ) from last_exc

    @staticmethod
    def _extract_results(data: Dict[str, Any]) -> List[Dict[str, Any]]:
        if not data:
            return []
        if "data" in data and isinstance(data["data"], dict):
            return list(data["data"].get("results") or [])
        if "results" in data:
            return list(data.get("results") or [])
        return []

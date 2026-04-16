from __future__ import annotations

import httpx
from fastapi import HTTPException


async def _client(cfg: dict) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        base_url=cfg["url"],
        auth=(cfg["username"], cfg["api_token"]),
        timeout=5.0,
    )


async def test_connection(cfg: dict) -> dict:
    """Test a Listmonk integration. Returns dict matching ConnectionTestResponse."""
    try:
        async with await _client(cfg) as client:
            health = await client.get("/api/health")
            health.raise_for_status()

            subs = await client.get(
                "/api/subscribers", params={"page": 1, "per_page": 1}
            )
            subs.raise_for_status()
            total = subs.json().get("data", {}).get("total", 0)

            return {
                "success": True,
                "message": "Connection successful",
                "subscriber_count": total,
            }

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Listmonk returned {e.response.status_code} — check your credentials.",
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=400,
            detail=f"Could not reach Listmonk at {cfg['url']} — check the URL.",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Connection to Listmonk timed out.")


async def get_lists(cfg: dict) -> list[dict]:
    """Fetch mailing lists from a Listmonk integration. Returns list of dicts matching ListmonkList."""
    try:
        async with await _client(cfg) as client:
            resp = await client.get("/api/lists", params={"page": 1, "per_page": 100})
            resp.raise_for_status()
            results = resp.json().get("data", {}).get("results", [])
            return [
                {
                    "id": lst["id"],
                    "name": lst["name"],
                    "subscriber_count": lst.get("subscriber_count", 0),
                    "type": lst.get("type", ""),
                }
                for lst in results
            ]

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Listmonk returned {e.response.status_code} — could not fetch lists.",
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=400,
            detail=f"Could not reach Listmonk at {cfg['url']}.",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Connection to Listmonk timed out.")

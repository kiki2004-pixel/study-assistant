from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl

from scrub.auth import verify_token
from scrub.settings import settings
from scrub.storage.integration_store import IntegrationStore, IntegrationType
from scrub.storage.user_store import UserStore

router = APIRouter()


# --- Dependency factories ---


def get_integration_store() -> IntegrationStore:
    return IntegrationStore(settings.scrub_db_url)


def get_user_store() -> UserStore:
    return UserStore(settings.scrub_db_url)


# --- Request / Response Models ---


class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    subscriber_count: int | None = None


class ListmonkConfig(BaseModel):
    url: HttpUrl
    username: str
    api_token: str


class IntegrationSummary(BaseModel):
    url: str
    username: str
    created_at: datetime


class ListmonkList(BaseModel):
    id: int
    name: str
    subscriber_count: int
    type: str


# --- Per-user integration endpoints ---


@router.get("/integration", response_model=IntegrationSummary)
async def get_integration(
    claims: dict = Depends(verify_token),
    integration_store: IntegrationStore = Depends(get_integration_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Return the current user's saved Listmonk integration (no password)."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    integration = integration_store.get(user.id, IntegrationType.listmonk)
    if not integration:
        raise HTTPException(
            status_code=404, detail="No Listmonk integration configured."
        )
    cfg = integration.config
    return IntegrationSummary(
        url=cfg["url"], username=cfg["username"], created_at=integration.created_at
    )


@router.put("/integration", response_model=IntegrationSummary)
async def save_integration(
    payload: ListmonkConfig,
    claims: dict = Depends(verify_token),
    integration_store: IntegrationStore = Depends(get_integration_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Save (or update) Listmonk credentials for the current user."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    config = {
        "url": str(payload.url),
        "username": payload.username,
        "api_token": payload.api_token,
    }
    integration = integration_store.upsert(user.id, IntegrationType.listmonk, config)
    cfg = integration.config
    return IntegrationSummary(
        url=cfg["url"], username=cfg["username"], created_at=integration.created_at
    )


@router.delete("/integration", status_code=204)
async def delete_integration(
    claims: dict = Depends(verify_token),
    integration_store: IntegrationStore = Depends(get_integration_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Disconnect (remove) the current user's Listmonk integration."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    deleted = integration_store.delete(user.id, IntegrationType.listmonk)
    if not deleted:
        raise HTTPException(
            status_code=404, detail="No Listmonk integration configured."
        )


@router.post("/integration/test", response_model=ConnectionTestResponse)
async def test_saved_integration(
    claims: dict = Depends(verify_token),
    integration_store: IntegrationStore = Depends(get_integration_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Test the current user's saved Listmonk credentials."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    integration = integration_store.get(user.id, IntegrationType.listmonk)
    if not integration:
        raise HTTPException(
            status_code=404, detail="No Listmonk integration configured."
        )

    cfg = integration.config
    url = cfg["url"]

    try:
        async with httpx.AsyncClient(
            base_url=url,
            auth=(cfg["username"], cfg["api_token"]),
            timeout=5.0,
        ) as client:
            health = await client.get("/api/health")
            health.raise_for_status()

            subs = await client.get(
                "/api/subscribers", params={"page": 1, "per_page": 1}
            )
            subs.raise_for_status()
            total = subs.json().get("data", {}).get("total", 0)

            return ConnectionTestResponse(
                success=True,
                message="Connection successful",
                subscriber_count=total,
            )

    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Listmonk returned {e.response.status_code} — check your credentials.",
        )
    except httpx.ConnectError:
        raise HTTPException(
            status_code=400,
            detail=f"Could not reach Listmonk at {url} — check the URL.",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Connection to Listmonk timed out.")


@router.get("/integration/lists", response_model=list[ListmonkList])
async def get_integration_lists(
    claims: dict = Depends(verify_token),
    integration_store: IntegrationStore = Depends(get_integration_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Fetch mailing lists from the current user's Listmonk instance."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    integration = integration_store.get(user.id, IntegrationType.listmonk)
    if not integration:
        raise HTTPException(
            status_code=404, detail="No Listmonk integration configured."
        )

    cfg = integration.config
    url = cfg["url"]

    try:
        async with httpx.AsyncClient(
            base_url=url,
            auth=(cfg["username"], cfg["api_token"]),
            timeout=5.0,
        ) as client:
            resp = await client.get("/api/lists", params={"page": 1, "per_page": 100})
            resp.raise_for_status()
            data = resp.json().get("data", {})
            results = data.get("results", [])

            return [
                ListmonkList(
                    id=lst["id"],
                    name=lst["name"],
                    subscriber_count=lst.get("subscriber_count", 0),
                    type=lst.get("type", ""),
                )
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
            detail=f"Could not reach Listmonk at {url}.",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Connection to Listmonk timed out.")

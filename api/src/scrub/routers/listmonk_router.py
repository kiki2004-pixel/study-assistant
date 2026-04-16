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


class ListmonkConfig(BaseModel):
    url: HttpUrl
    username: str
    api_token: str


class IntegrationSummary(BaseModel):
    id: int
    url: str
    username: str
    created_at: datetime


class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    subscriber_count: int | None = None


class ListmonkList(BaseModel):
    id: int
    name: str
    subscriber_count: int
    type: str


# --- Helper ---


def _require_owned(
    integration_id: int,
    user_id: int,
    store: IntegrationStore,
):
    """Fetch integration by id and verify it belongs to the user."""
    integration = store.get_by_id(integration_id)
    if not integration or integration.user_id != user_id:
        raise HTTPException(status_code=404, detail="Integration not found.")
    return integration


async def _httpx_client(cfg: dict):
    return httpx.AsyncClient(
        base_url=cfg["url"],
        auth=(cfg["username"], cfg["api_token"]),
        timeout=5.0,
    )


# --- Collection endpoints ---


@router.get("/integrations", response_model=list[IntegrationSummary])
async def list_integrations(
    claims: dict = Depends(verify_token),
    integration_store: IntegrationStore = Depends(get_integration_store),
    user_store: UserStore = Depends(get_user_store),
):
    """List all Listmonk integrations for the current user."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    integrations = integration_store.list_by_type(user.id, IntegrationType.listmonk)
    return [
        IntegrationSummary(
            id=i.id,
            url=i.config["url"],
            username=i.config["username"],
            created_at=i.created_at,
        )
        for i in integrations
    ]


@router.post("/integrations", response_model=IntegrationSummary, status_code=201)
async def create_integration(
    payload: ListmonkConfig,
    claims: dict = Depends(verify_token),
    integration_store: IntegrationStore = Depends(get_integration_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Create a new Listmonk integration for the current user."""
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
    integration = integration_store.create(user.id, IntegrationType.listmonk, config)
    return IntegrationSummary(
        id=integration.id,
        url=integration.config["url"],
        username=integration.config["username"],
        created_at=integration.created_at,
    )


@router.get("/integrations/{integration_id}", response_model=IntegrationSummary)
async def get_integration(
    integration_id: int,
    claims: dict = Depends(verify_token),
    integration_store: IntegrationStore = Depends(get_integration_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Get a single Listmonk integration."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    integration = _require_owned(integration_id, user.id, integration_store)
    return IntegrationSummary(
        id=integration.id,
        url=integration.config["url"],
        username=integration.config["username"],
        created_at=integration.created_at,
    )


@router.put("/integrations/{integration_id}", response_model=IntegrationSummary)
async def update_integration(
    integration_id: int,
    payload: ListmonkConfig,
    claims: dict = Depends(verify_token),
    integration_store: IntegrationStore = Depends(get_integration_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Update credentials for a Listmonk integration."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    _require_owned(integration_id, user.id, integration_store)
    config = {
        "url": str(payload.url),
        "username": payload.username,
        "api_token": payload.api_token,
    }
    integration = integration_store.update(integration_id, config)
    return IntegrationSummary(
        id=integration.id,
        url=integration.config["url"],
        username=integration.config["username"],
        created_at=integration.created_at,
    )


@router.delete("/integrations/{integration_id}", status_code=204)
async def delete_integration(
    integration_id: int,
    claims: dict = Depends(verify_token),
    integration_store: IntegrationStore = Depends(get_integration_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Delete a Listmonk integration."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    _require_owned(integration_id, user.id, integration_store)
    integration_store.delete_by_id(integration_id)


@router.post(
    "/integrations/{integration_id}/test", response_model=ConnectionTestResponse
)
async def test_integration(
    integration_id: int,
    claims: dict = Depends(verify_token),
    integration_store: IntegrationStore = Depends(get_integration_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Test a saved Listmonk integration."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    integration = _require_owned(integration_id, user.id, integration_store)
    cfg = integration.config

    try:
        async with await _httpx_client(cfg) as client:
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
            detail=f"Could not reach Listmonk at {cfg['url']} — check the URL.",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Connection to Listmonk timed out.")


@router.get("/integrations/{integration_id}/lists", response_model=list[ListmonkList])
async def get_integration_lists(
    integration_id: int,
    claims: dict = Depends(verify_token),
    integration_store: IntegrationStore = Depends(get_integration_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Fetch mailing lists from a Listmonk integration."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    integration = _require_owned(integration_id, user.id, integration_store)
    cfg = integration.config

    try:
        async with await _httpx_client(cfg) as client:
            resp = await client.get("/api/lists", params={"page": 1, "per_page": 100})
            resp.raise_for_status()
            results = resp.json().get("data", {}).get("results", [])

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
            detail=f"Could not reach Listmonk at {cfg['url']}.",
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=408, detail="Connection to Listmonk timed out.")

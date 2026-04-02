from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx

from scrub.settings import get_settings, block_ssrf

router = APIRouter()

class ListmonkSettings(BaseModel):
    listmonk_url: str
    listmonk_user: str
    listmonk_pass: str
    listmonk_list_id: str
    listmonk_exclude_name_substrings: str = ""


class ListmonkSettingsResponse(BaseModel):
    listmonk_url: str
    listmonk_user: str
    listmonk_list_id: str
    listmonk_exclude_name_substrings: str
    # Never return the password


class ConnectionTestResponse(BaseModel):
    success: bool
    message: str
    subscriber_count: int | None = None


@router.get("/settings", response_model=ListmonkSettingsResponse)
async def get_listmonk_settings():
    """
    Returns the current Listmonk integration settings.
    Password is intentionally excluded from the response.
    """
    s = get_settings()
    return ListmonkSettingsResponse(
        listmonk_url=s.listmonk_url,
        listmonk_user=s.listmonk_user,
        listmonk_list_id=s.listmonk_list_id,
        listmonk_exclude_name_substrings=s.listmonk_exclude_name_substrings,
    )


@router.post("/test-connection", response_model=ConnectionTestResponse)
async def test_listmonk_connection(payload: ListmonkSettings):
    """
    Tests a Listmonk connection using the provided credentials.
    Hits the /api/health endpoint and fetches subscriber count to verify access.
    """
    try:
        async with httpx.AsyncClient(
            base_url=payload.listmonk_url,
            headers={
                "Authorization": f"token {payload.listmonk_user}:{payload.listmonk_pass}"
            },
            timeout=5.0,
        ) as client:
            # 1. Health check
            health = await client.get("/api/health")
            health.raise_for_status()

            # 2. Fetch subscriber count to verify credentials work
            subs = await client.get(
                "/api/subscribers",
                params={"page": 1, "per_page": 1},
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
            detail=f"Could not reach Listmonk at {payload.listmonk_url} — check the URL.",
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=408,
            detail="Connection to Listmonk timed out.",
        )
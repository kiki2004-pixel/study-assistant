from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from scrub.auth import verify_token
from scrub.settings import settings
from scrub.storage.api_key_store import ApiKeyStore
from scrub.storage.user_store import UserStore

router = APIRouter()


def get_api_key_store() -> ApiKeyStore:
    return ApiKeyStore(settings.scrub_db_url)


def get_user_store() -> UserStore:
    return UserStore(settings.scrub_db_url)


# Models


class CreateApiKeyRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class CreateApiKeyResponse(BaseModel):
    id: int
    name: str
    key: str  # raw key — shown once only
    created_at: datetime


class ApiKeyItem(BaseModel):
    id: int
    name: str
    created_at: datetime
    last_used_at: datetime | None
    active: bool


# Routes


@router.post("", response_model=CreateApiKeyResponse, status_code=201)
async def create_api_key(
    payload: CreateApiKeyRequest,
    claims: dict = Depends(verify_token),
    key_store: ApiKeyStore = Depends(get_api_key_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Create a new API key for the authenticated user.

    The raw key is returned once and cannot be retrieved again.
    Store it securely immediately after creation.
    """
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    key, raw = key_store.create(user_id=user.id, name=payload.name)
    return CreateApiKeyResponse(
        id=key.id,
        name=key.name,
        key=raw,
        created_at=key.created_at,
    )


@router.get("", response_model=list[ApiKeyItem])
async def list_api_keys(
    claims: dict = Depends(verify_token),
    key_store: ApiKeyStore = Depends(get_api_key_store),
    user_store: UserStore = Depends(get_user_store),
):
    """List all API keys for the authenticated user."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    keys = key_store.list_for_user(user.id)
    return [
        ApiKeyItem(
            id=k.id,
            name=k.name,
            created_at=k.created_at,
            last_used_at=k.last_used_at,
            active=k.active,
        )
        for k in keys
    ]


@router.delete("/{key_id}", status_code=204)
async def revoke_api_key(
    key_id: int,
    claims: dict = Depends(verify_token),
    key_store: ApiKeyStore = Depends(get_api_key_store),
    user_store: UserStore = Depends(get_user_store),
):
    """Revoke an API key. Keys can only be revoked by their owner."""
    user = user_store.get_or_create(
        sub=claims["sub"],
        email=claims.get("email"),
        name=claims.get("name"),
    )
    revoked = key_store.revoke(key_id=key_id, user_id=user.id)
    if not revoked:
        raise HTTPException(status_code=404, detail="API key not found.")

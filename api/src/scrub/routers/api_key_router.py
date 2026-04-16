from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from scrub.auth import verify_token
from scrub.repositories.api_key_repository import (
    ApiKeyRepository,
    get_api_key_repository,
)

router = APIRouter()


class CreateApiKeyRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class CreateApiKeyResponse(BaseModel):
    id: int
    name: str
    key: str
    created_at: datetime


class ApiKeyItem(BaseModel):
    id: int
    name: str
    created_at: datetime
    last_used_at: datetime | None
    active: bool


@router.post("", response_model=CreateApiKeyResponse, status_code=201)
async def create_api_key(
    payload: CreateApiKeyRequest,
    claims: dict = Depends(verify_token),
    repo: ApiKeyRepository = Depends(get_api_key_repository),
):
    """Create a new API key for the authenticated user. The raw key is returned once only."""
    return repo.create(
        claims["sub"], claims.get("email"), claims.get("name"), payload.name
    )


@router.get("", response_model=list[ApiKeyItem])
async def list_api_keys(
    claims: dict = Depends(verify_token),
    repo: ApiKeyRepository = Depends(get_api_key_repository),
):
    """List all API keys for the authenticated user."""
    return repo.list(claims["sub"], claims.get("email"), claims.get("name"))


@router.delete("/{key_id}", status_code=204)
async def revoke_api_key(
    key_id: int,
    claims: dict = Depends(verify_token),
    repo: ApiKeyRepository = Depends(get_api_key_repository),
):
    """Revoke an API key. Keys can only be revoked by their owner."""
    if not repo.revoke(key_id, claims["sub"], claims.get("email"), claims.get("name")):
        raise HTTPException(status_code=404, detail="API key not found.")

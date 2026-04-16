from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from scrub.auth import verify_token
from scrub.repositories.user_repository import UserRepository, get_user_repository

router = APIRouter()


class UserStatsResponse(BaseModel):
    total_validations: int
    validations_this_month: int


class UserContext(BaseModel):
    id: int
    email: str | None = None
    name: str | None = None
    created_at: datetime
    stats: UserStatsResponse


@router.get("/context", response_model=UserContext)
async def get_current_user(
    payload: dict = Depends(verify_token),
    repo: UserRepository = Depends(get_user_repository),
) -> UserContext:
    return repo.get_context(payload["sub"], payload.get("email"), payload.get("name"))

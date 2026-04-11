from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from scrub.auth import verify_token
from scrub.settings import settings
from scrub.storage.user_store import UserStore

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


def get_user_store() -> UserStore:
    return UserStore(settings.watermark_db_url)


@router.get("/context", response_model=UserContext)
async def get_current_user(
    payload: dict = Depends(verify_token),
    store: UserStore = Depends(get_user_store),
) -> UserContext:
    user = store.get_or_create(
        sub=payload["sub"],
        email=payload.get("email"),
        name=payload.get("name"),
    )
    stats = store.get_stats(user.id)
    return UserContext(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.created_at,
        stats=UserStatsResponse(
            total_validations=stats.total_validations,
            validations_this_month=stats.validations_this_month,
        ),
    )

from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from scrub.auth import verify_token
from scrub.settings import settings
from scrub.storage.user_store import UserStore

router = APIRouter()


class UserInfo(BaseModel):
    id: int
    email: str | None = None
    name: str | None = None
    created_at: datetime


@router.get("/me", response_model=UserInfo)
async def get_current_user(payload: dict = Depends(verify_token)) -> UserInfo:
    user = UserStore(settings.watermark_db_url).get_or_create(
        sub=payload["sub"],
        email=payload.get("email"),
        name=payload.get("name"),
    )
    return UserInfo(id=user.id, email=user.email, name=user.name, created_at=user.created_at)

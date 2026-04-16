from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl

from scrub.auth import verify_api_key
from scrub.repositories.webhook_repository import (
    WebhookRepository,
    get_webhook_repository,
)

router = APIRouter()


class RegisterWebhookRequest(BaseModel):
    url: HttpUrl


class RegisterWebhookResponse(BaseModel):
    url: str
    secret: str
    message: str


class WebhookListItem(BaseModel):
    id: int
    url: str
    active: bool
    failure_count: int


@router.post("/register", response_model=RegisterWebhookResponse)
async def register_webhook(
    payload: RegisterWebhookRequest,
    repo: WebhookRepository = Depends(get_webhook_repository),
    _: dict = Depends(verify_api_key),
):
    return repo.register(str(payload.url))


@router.delete("/deregister")
async def deregister_webhook(
    url: HttpUrl,
    repo: WebhookRepository = Depends(get_webhook_repository),
    _: dict = Depends(verify_api_key),
):
    if not repo.deregister(str(url)):
        raise HTTPException(status_code=404, detail="Webhook URL not found.")
    return {"message": "Webhook deregistered successfully."}


@router.get("/list", response_model=list[WebhookListItem])
async def list_webhooks(
    repo: WebhookRepository = Depends(get_webhook_repository),
    _: dict = Depends(verify_api_key),
):
    return repo.list_active()

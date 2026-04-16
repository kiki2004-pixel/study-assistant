from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl

from scrub.auth import verify_api_key
from scrub.settings import settings, block_ssrf
from scrub.storage.webhook_store import WebhookStore

router = APIRouter()


# Dependency


def get_webhook_store() -> WebhookStore:
    return WebhookStore(settings.scrub_db_url)


# Models


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


# Routes


@router.post("/register", response_model=RegisterWebhookResponse)
async def register_webhook(
    payload: RegisterWebhookRequest,
    store: WebhookStore = Depends(get_webhook_store),
    _: dict = Depends(verify_api_key),
):
    block_ssrf(payload.url)
    reg = store.register(str(payload.url))
    return RegisterWebhookResponse(
        url=reg.url,
        secret=reg.secret,
        message="Webhook registered. Save the secret — it will not be shown again.",
    )


@router.delete("/deregister")
async def deregister_webhook(
    url: HttpUrl,
    store: WebhookStore = Depends(get_webhook_store),
    _: dict = Depends(verify_api_key),
):
    removed = store.deregister(str(url))
    if not removed:
        raise HTTPException(status_code=404, detail="Webhook URL not found.")
    return {"message": "Webhook deregistered successfully."}


@router.get("/list", response_model=list[WebhookListItem])
async def list_webhooks(
    store: WebhookStore = Depends(get_webhook_store),
    _: dict = Depends(verify_api_key),
):
    return [
        WebhookListItem(
            id=r.id, url=r.url, active=r.active, failure_count=r.failure_count
        )
        for r in store.list_active()
    ]

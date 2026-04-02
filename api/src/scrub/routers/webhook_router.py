from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl

<<<<<<<< HEAD:api/src/scrub/routers/webhook_router.py
from mail_validation.settings import settings
from mail_validation.storage.webhook_store import WebhookStore
========
from scrub.settings import settings, block_ssrf
from scrub.storage.webhook_store import WebhookStore
>>>>>>>> 15060365 (rebrand mail-validation to scrub across backend, web, and CI):src/scrub/routers/webhook_router.py

router = APIRouter()


def get_webhook_store() -> WebhookStore:
    return WebhookStore(settings.watermark_db_url)

class RegisterWebhookRequest(BaseModel):
    url: HttpUrl


class RegisterWebhookResponse(BaseModel):
    url: str
    secret: str
    message: str


class DeregisterWebhookRequest(BaseModel):
    url: HttpUrl


class WebhookListItem(BaseModel):
    id: int
    url: str
    active: bool
    failure_count: int

@router.post("/register", response_model=RegisterWebhookResponse)
async def register_webhook(
    payload: RegisterWebhookRequest,
    store: WebhookStore = Depends(get_webhook_store),
):
    _block_ssrf(payload.url)
    reg = store.register(str(payload.url))
    return RegisterWebhookResponse(
        url=reg.url,
        secret=reg.secret,
        message="Webhook registered. Save the secret — it will not be shown again.",
    )


@router.delete("/deregister")
async def deregister_webhook(
    payload: DeregisterWebhookRequest,
    store: WebhookStore = Depends(get_webhook_store),
):
    removed = store.deregister(str(payload.url))
    if not removed:
        raise HTTPException(status_code=404, detail="Webhook URL not found.")
    return {"message": "Webhook deregistered successfully."}


@router.get("/list", response_model=list[WebhookListItem])
async def list_webhooks(store: WebhookStore = Depends(get_webhook_store)):
    return [
        WebhookListItem(
            id=r.id, url=r.url, active=r.active, failure_count=r.failure_count
        )
        for r in store.list_active()
    ]
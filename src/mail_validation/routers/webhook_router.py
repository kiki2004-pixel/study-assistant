from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, HttpUrl

from mail_validation.settings import settings
from mail_validation.storage.webhook_store import WebhookStore

router = APIRouter()
store = WebhookStore(settings.watermark_db_url)

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
async def register_webhook(payload: RegisterWebhookRequest):
    """
    Register a URL to receive webhook callbacks when validation completes.
    Returns a signing secret — use it to verify X-Webhook-Signature-256 headers.
    """
    reg = store.register(str(payload.url))
    return RegisterWebhookResponse(
        url=reg.url,
        secret=reg.secret,
        message="Webhook registered. Save the secret — it will not be shown again.",
    )


@router.delete("/deregister")
async def deregister_webhook(payload: DeregisterWebhookRequest):
    """Remove a webhook registration by URL."""
    removed = store.deregister(str(payload.url))
    if not removed:
        raise HTTPException(status_code=404, detail="Webhook URL not found.")
    return {"message": "Webhook deregistered successfully."}


@router.get("/list", response_model=list[WebhookListItem])
async def list_webhooks():
    """List all active webhook registrations."""
    return [
        WebhookListItem(
            id=r.id, url=r.url, active=r.active, failure_count=r.failure_count
        )
        for r in store.list_active()
    ]
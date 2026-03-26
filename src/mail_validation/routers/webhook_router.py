import ipaddress
import socket

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, HttpUrl

from mail_validation.settings import settings
from mail_validation.storage.webhook_store import WebhookStore

router = APIRouter()


def get_webhook_store() -> WebhookStore:
    return WebhookStore(settings.watermark_db_url)


def _block_ssrf(url: HttpUrl) -> None:
    """Reject webhook URLs that resolve to private/internal IP ranges."""
    try:
        ip = ipaddress.ip_address(socket.gethostbyname(url.host))
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
            raise HTTPException(
                status_code=400,
                detail="URL resolves to a private or reserved IP address.",
            )
    except socket.gaierror:
        raise HTTPException(status_code=400, detail=f"Could not resolve host: {url.host}")


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
    url: HttpUrl,
    store: WebhookStore = Depends(get_webhook_store),
):
    removed = store.deregister(str(url))
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

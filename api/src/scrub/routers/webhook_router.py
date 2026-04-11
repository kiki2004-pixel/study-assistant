from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, HttpUrl

from scrub.settings import settings, block_ssrf
from scrub.storage.webhook_store import WebhookStore

router = APIRouter()

# Auth
API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=True)


def verify_api_key(api_key: str = Security(API_KEY_HEADER)) -> str:
    if api_key != settings.api_key:
        raise HTTPException(status_code=403, detail="Invalid or missing API key.")
    return api_key


# Dependency


def get_webhook_store() -> WebhookStore:
    return WebhookStore(settings.watermark_db_url)


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
    _: str = Depends(verify_api_key),
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
    _: str = Depends(verify_api_key),
):
    removed = store.deregister(str(url))
    if not removed:
        raise HTTPException(status_code=404, detail="Webhook URL not found.")
    return {"message": "Webhook deregistered successfully."}


@router.get("/list", response_model=list[WebhookListItem])
async def list_webhooks(
    store: WebhookStore = Depends(get_webhook_store),
    _: str = Depends(verify_api_key),
):
    return [
        WebhookListItem(
            id=r.id, url=r.url, active=r.active, failure_count=r.failure_count
        )
        for r in store.list_active()
    ]

import tomllib
from pathlib import Path

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from scrub.routers.validation_router import router as validation_router
from scrub.routers.listmonk_router import router as listmonk_router
from scrub.routers.webhook_router import router as webhook_router
from scrub.routers.user_router import router as user_router
from scrub.routers.history_router import router as history_router
from scrub.storage.webhook_store import WebhookStore
from scrub.storage.user_store import UserStore
from scrub.storage.history_store import HistoryStore
from scrub.settings import settings
from prometheus_fastapi_instrumentator import Instrumentator


if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        integrations=[FastApiIntegration(), SqlalchemyIntegration()],
        traces_sample_rate=0.05,
        send_default_pii=False,
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run schema init once at startup — not on every request
    WebhookStore(settings.watermark_db_url).init_schema()
    UserStore(settings.watermark_db_url).init_schema()
    HistoryStore(settings.watermark_db_url).init_schema()
    yield


CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
pyproject_path = PROJECT_ROOT / "pyproject.toml"

with open(pyproject_path, "rb") as f:
    data = tomllib.load(f)
    title = data["project"].get("name")
    description = data["project"].get("description")
    version = data["project"].get("version")

app = FastAPI(
    title=title,
    description=description,
    version=version,
    lifespan=lifespan,
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Initialize Metrics Engine ---
Instrumentator().instrument(app).expose(app)

# Validation Endpoint: /validation/validate-single
app.include_router(
    router=validation_router, prefix="/validation", tags=["Email Validation"]
)

# Listmonk Integration: /listmonk/settings, /listmonk/test-connection
app.include_router(
    router=listmonk_router, prefix="/listmonk", tags=["Listmonk Integration"]
)

# Webhooks: /webhooks/register, /webhooks/deregister, /webhooks/list
app.include_router(router=webhook_router, prefix="/webhooks", tags=["Webhooks"])

# User: /context
app.include_router(router=user_router, prefix="", tags=["User"])

# Validation History: /validation/history
app.include_router(router=history_router, prefix="/validation/history", tags=["Validation History"])

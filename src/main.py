import tomllib
from pathlib import Path
from fastapi import FastAPI
from contextlib import asynccontextmanager
from mail_validation.routers.validation_router import router as validation_router
from mail_validation.routers.listmonk_router import router as listmonk_router
from mail_validation.routers.webhook_router import router as webhook_router
from mail_validation.storage.webhook_store import WebhookStore
from mail_validation.settings import settings
from prometheus_fastapi_instrumentator import Instrumentator
from contextlib import asynccontextmanager

from mail_validation.jobs.listmonk_validator import run_cycle


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run schema init once at startup — not on every request
    WebhookStore(settings.watermark_db_url).init_schema()
    yield


CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
pyproject_path = PROJECT_ROOT / "pyproject.toml"

with open(pyproject_path, "rb") as f:
    data = tomllib.load(f)
    title = data["project"].get("name")
    description = data["project"].get("description")
    version = data["project"].get("version")


@asynccontextmanager
async def _kickoff_listmonk_validation(app: FastAPI):
    run_cycle.apply_async()
    yield


app = FastAPI(
    title=title,
    description=description,
    version=version,
    lifespan=lifespan,

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

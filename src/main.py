import tomllib
from pathlib import Path
from fastapi import FastAPI
from mail_validation.routers.validation_router import router as validation_router
from mail_validation.routers.listmonk_router import router as listmonk_router
from prometheus_fastapi_instrumentator import Instrumentator
from contextlib import asynccontextmanager

from mail_validation.jobs.listmonk_validator import run_cycle

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
    lifespan=_kickoff_listmonk_validation,
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
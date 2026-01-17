import tomllib
from pathlib import Path  
from fastapi import FastAPI
from mail_validation.routers.validation_router import router as validation_router
# comment out needed on issue 2
# from mail_validation.routers.postmark_router import router as postmark_router

CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
pyproject_path = PROJECT_ROOT / "pyproject.toml"

with open(pyproject_path, "rb") as f:
    data = tomllib.load(f)
    title = data["project"].get("name")
    description = data["project"].get("description")
    version = data["project"].get("version")

app = FastAPI(title=title, description=description, version=version)

# Validation Endpoint: /validation/validate-single
app.include_router(
    router=validation_router,  
    prefix="/validation",
    tags=["Email Validation"]
)

# 2. Add this to enable the Webhook: /webhooks/postmark
# issue 2
#app.include_router(
#    router=postmark_router,
#   prefix="/webhooks",
#   tags=["Postmark"]
#)

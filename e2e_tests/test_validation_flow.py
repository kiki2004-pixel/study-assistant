import os

import pytest
from fastapi.testclient import TestClient

from main import app
from mail_validation.services.listmonk_client import ListmonkClient


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default)


@pytest.mark.skipif(
    not (_env("LISTMONK_BASE_URL") and _env("LISTMONK_API_USER") and _env("LISTMONK_API_TOKEN")),
    reason="LISTMONK_BASE_URL/USER/TOKEN not set",
)
def test_listmonk_api_reachable():
    client = TestClient(app)
    resp = client.get("/metrics")
    assert resp.status_code == 200


@pytest.mark.asyncio
@pytest.mark.skipif(
    not (_env("LISTMONK_BASE_URL") and _env("LISTMONK_API_USER") and _env("LISTMONK_API_TOKEN")),
    reason="LISTMONK_BASE_URL/USER/TOKEN not set",
)
async def test_listmonk_fetch_lists_smoke():
    async with ListmonkClient(
        base_url=_env("LISTMONK_BASE_URL"),
        api_user=_env("LISTMONK_API_USER"),
        api_token=_env("LISTMONK_API_TOKEN"),
    ) as client:
        lists = await client.fetch_lists()
    assert isinstance(lists, list)

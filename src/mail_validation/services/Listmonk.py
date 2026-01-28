
import httpx
from listmonk.models import Subscriber
from pydantic import BaseModel

from mail_validation.settings import Settings


class ListmonkResults(BaseModel):
    results: list[Subscriber]
    total: int


class ListmonkData(BaseModel):
    data: ListmonkResults


class Subscriber(BaseModel):
    id: int
    email: str
    status: str
    created_at: str
    updated_at: str


class Listmonk:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.http_client = httpx.Client(
            base_url=settings.listmonk_url,
            headers={
                "Authorization": f"token {settings.listmonk_user}:{settings.listmonk_pass}"
            },
        )

    def subscribers(self, page: int, page_size: int = 100) -> ListmonkData:
        result = self.http_client.get(
            f"/api/subscribers?page={page}&per_page={page_size}&query=subscribers.status = 'enabled'"
        )
        return ListmonkData(**result.json())

    def add_subs_to_blocklist(self, ids: list[int]):
        result = self.http_client.put("/api/subscribers/blocklist", json={"ids": ids})
        return result.json()

    def subscriber_by_email(self, email: str) -> Subscriber:
        result = self.http_client.get(
            f"/api/subscribers?query=subscribers.email = '{email}'"
        )
        return ListmonkData(**result.json()).data.results[0]

    def unsubscribe_subscriber(self, email: str):
        result = self.http_client.put(
            "/api/subscribers/query/blocklist",
            json={"query": f"subscribers.email = '{email}'"},
        )
        return result.json()

    def subscribers_count(self) -> int:
        result = self.subscribers(1, 1)
        return result.data.total

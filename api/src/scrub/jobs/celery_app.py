import sentry_sdk
from celery.app import Celery
from email_validator import validate_email
from sentry_sdk.integrations.celery import CeleryIntegration

from scrub.services.listmonk import ListmonkClient
from scrub.settings import Settings
from scrub.storage.integration_store import IntegrationStore

settings = Settings()

if settings.sentry_dsn:
    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        integrations=[CeleryIntegration()],
        traces_sample_rate=0.05,
        send_default_pii=False,
    )

celery_app = Celery(
    __name__,
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)


def _get_listmonk_client(integration_id: int) -> ListmonkClient | None:
    """Look up the integration by id and return a client, or None."""
    store = IntegrationStore(settings.scrub_db_url)
    integration = store.get_by_id(integration_id)
    if not integration:
        return None
    cfg = integration.config
    return ListmonkClient(cfg["url"], cfg["username"], cfg["api_token"])


@celery_app.task(name="validate_list_page")
def validate_list_page(
    integration_id: int, list_id: int | None, page: int, page_size: int
):
    """
    Validate one page of subscribers for a Listmonk integration.
    Subscribers whose email fails validation are added to the blocklist.
    """
    client = _get_listmonk_client(integration_id)
    if not client:
        return

    if list_id is None:
        return
    subscribers = client.subscribers(list_id)
    to_block = []
    for sub in subscribers:
        try:
            validate_email(sub.email, check_deliverability=True)
        except Exception as e:
            print(f"{sub.email}: {e}")
            to_block.append(sub)

    for sub in to_block:
        client.block_subscriber(sub)
    if to_block:
        print(f"Blocklisted {len(to_block)} subscriber(s)")


@celery_app.task(name="start_list_validation")
def start_list_validation(integration_id: int, list_id: int | None = None):
    """
    Kick off paged validation for a Listmonk integration's list.
    Fans out one validate_list_page task per page.
    """
    client = _get_listmonk_client(integration_id)
    if not client:
        return

    print(f"Queuing validation for integration {integration_id}, list {list_id}")
    validate_list_page.delay(integration_id, list_id, 1, 100)

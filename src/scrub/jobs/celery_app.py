import time

from celery.app import Celery
from email_validator import validate_email

from scrub.services.Listmonk import Listmonk
from scrub.settings import Settings

settings = Settings()
celery_app = Celery(
    __name__, broker=settings.celery_broker_url, backend=settings.celery_broker_url
)


@celery_app.task(name="validate_emails")
def validate_emails(page: int, page_size: int):
    listmonk = Listmonk(settings)
    subscribers = listmonk.subscribers(page, page_size)
    ids: list[int] = []
    for sub in subscribers.data.results:
        try:
            validate_email(sub.email, check_deliverability=True)
        except Exception as e:
            print(f"{sub.email}: {e}")
            ids.append(sub.id)
    if len(ids) > 0:
        result = listmonk.add_subs_to_blocklist(ids)
        print(f"Add {len(ids)} to blocklist: result = {result}")


@celery_app.task(name="start_scheduler")
def start_scheduler():
    listmonk = Listmonk(Settings())
    total = listmonk.subscribers_count()
    print(f"Total subscribers: {total}")
    page = 1
    while True:
        validate_emails.delay(page, 100)
        print(f"Starting page {page}")
        if page * 100 >= total:
            break
        page += 1
    time.sleep(60)


celery_app.conf.beat_schedule = {
    "start_scheduler": {"task": "start_scheduler", "schedule": 60}
}

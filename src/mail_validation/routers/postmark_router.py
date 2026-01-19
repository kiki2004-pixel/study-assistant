from fastapi import APIRouter, Request, Header
from prometheus_client import Counter
from mail_validation.settings import settings

router = APIRouter()

# Define Prometheus Metrics for Grafana
# Renamed to reflect that we are tracking "events"
BOUNCE_STATS_COUNTER = Counter(
    "postmark_bounce_events_total",
    "Total number of bounce events received from Postmark",
    ["event_type", "source"]
)

@router.post("/postmark")
async def postmark_webhook(request: Request, x_postmark_secret: str = Header(None)):
    """
    Receives bounce events from Postmark and records statistics for Grafana.
    Does NOT call Listmonk, as Listmonk handles bounces automatically.
    """
    # 1. Security Check
    assert x_postmark_secret == settings.postmark_webhook_secret, "Invalid Webhook Secret"

    data = await request.json()
    
    # 2. Extract Data
    event_type = data.get("Type", "Unknown") # e.g., HardBounce, SpamComplaint

    # 3. Record Statistics for Grafana
    
    BOUNCE_STATS_COUNTER.labels(
        event_type=event_type,
        source="postmark"
    ).inc()

    # 4. Return success to Postmark
    return {
        "status": "recorded", 
        "event": event_type
    }

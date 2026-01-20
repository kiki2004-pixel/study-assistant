from fastapi import APIRouter, Request, Header, HTTPException
from prometheus_client import Counter
from mail_validation.settings import settings

router = APIRouter()

# Define Prometheus Metrics for Grafana
# Labels allow you to filter by 'HardBounce', 'SpamComplaint', etc., in Grafana
BOUNCE_STATS_COUNTER = Counter(
    "postmark_bounce_events_total",
    "Total number of bounce events received from Postmark",
    ["event_type", "source"]
)

@router.post("/postmark")
async def postmark_webhook(request: Request, x_postmark_secret: str = Header(None)):
    """
    Receives bounce events from Postmark and records statistics for Grafana.
    Statistics only; no blacklisting performed as per Kuda's latest feedback.
    """
    # 1. Security Check using assert 
    assert x_postmark_secret == settings.postmark_webhook_secret, "Invalid Webhook Secret"

    try:
        data = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")
    
    # 2. Extract Data from Postmark payload
    # Reference: https://postmarkapp.com
    event_type = data.get("Type", "Unknown") 

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

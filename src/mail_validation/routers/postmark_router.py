import json
from fastapi import APIRouter, Request, Header, HTTPException
from prometheus_client import Counter
from mail_validation.settings import settings

router = APIRouter()

# Define Prometheus Metrics for Grafana
BOUNCE_STATS_COUNTER = Counter(
    "postmark_bounce_events_total",
    "Total number of bounce events received from Postmark",
    ["event_type", "source"]
)

@router.post("/postmark")
async def postmark_webhook(request: Request, x_postmark_secret: str = Header(None)):
    """
    Receives bounce events from Postmark and records statistics for Grafana.
    Statistics only; no blacklisting performed as per internal feedback.
    """
    # 1. Security Check
    # We use a formal check instead of assert for production safety (PEP 668)
    if x_postmark_secret != settings.postmark_webhook_secret:
        raise HTTPException(
            status_code=401, 
            detail="Unauthorized: Invalid Webhook Secret"
        )

    # 2. Extract Data from Postmark payload
    try:
        data = await request.json()
    except json.JSONDecodeError:
        # Catching specific JSON error instead of broad Exception
        raise HTTPException(
            status_code=400, 
            detail="Malformed JSON payload"
        )
    
    # 3. Parse and Record Statistics
    # Postmark Reference: https://postmarkapp.com/developer/webhooks/bounce-webhook
    event_type = data.get("Type", "Unknown") 

    BOUNCE_STATS_COUNTER.labels(
        event_type=event_type,
        source="postmark"
    ).inc()

    # 4. Return success to Postmark
    return {
        "status": "recorded", 
        "event": event_type
    }

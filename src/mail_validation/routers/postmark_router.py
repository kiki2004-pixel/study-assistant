from fastapi import APIRouter, Request, Header, HTTPException
from prometheus_client import Counter
from mail_validation.utils.listmonk_client import block_email
from mail_validation.utils.mailso_client import validate_email
from mail_validation.settings import settings

router = APIRouter()

# Define Prometheus Metrics for Grafana
BLACKLIST_COUNTER = Counter(
    "emails_blacklisted_total",
    "Total number of emails added to the blacklist",
    ["reason", "source_list", "postmark_event_type"]
)

@router.post("/postmark")
async def postmark_webhook(request: Request, x_postmark_secret: str = Header(None)):
    """
    Receives bounce events from Postmark, validates via Mails.so, 
    and blacklists in Listmonk.
    """
    # 1. Security Check
    if x_postmark_secret != settings.postmark_webhook_secret:
        raise HTTPException(status_code=401, detail="Invalid Webhook Secret")

    data = await request.json()
    
    # 2. Extract Data from Postmark Payload
    email = data.get("Email")
    event_type = data.get("Type", "Unknown")  # e.g., HardBounce, SpamComplaint
    description = data.get("Description", "No description provided")

    if not email:
        return {"status": "ignored", "message": "No email found in payload"}

    # 3. Optional: Verify with Mails.so before blacklisting
    # This prevents blacklisting if Postmark has a temporary error
    validation_data = validate_email(email)
    status = validation_data.get("result", "unknown")

    if status in ["undeliverable", "risky"] or event_type in ["HardBounce", "SpamComplaint"]:
        # 4. Action: Blacklist in Listmonk
        block_reason = f"Postmark {event_type}: {description}"
        listmonk_res = block_email(email, reason=block_reason)

        # 5. Update Metrics for Grafana
        BLACKLIST_COUNTER.labels(
            reason=status,
            source_list="postmark_webhook",
            postmark_event_type=event_type
        ).inc()

        return {
            "status": "success", 
            "blacklisted": email, 
            "listmonk": listmonk_res
        }

    return {"status": "skipped", "message": "Email considered deliverable by Mails.so"}

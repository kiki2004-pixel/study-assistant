from fastapi import APIRouter, HTTPException, Query
from mail_validation.utils.mailso_client import validate_email
from mail_validation.utils.listmonk_client import block_email
from mail_validation.models.validation import ValidationResponse

# Define the router with a prefix so all paths start with /validation
router = APIRouter()

@router.post("/validate-single", response_model=ValidationResponse)
async def validate_and_block(
    email: str = Query(..., description="The email address to validate and potentially blacklist")
):
    """
    Verifies the deliverability of a single email address:
    1. Validates email via Mails.so
    2. If status is 'undeliverable' or 'risky', adds it to Listmonk Blacklist.
    """
    try:
        # 1. Call Mails.so Client
        # The result usually contains 'result' (deliverable/undeliverable) and 'reason'
        validation_data = validate_email(email)
        status = validation_data.get("result", "unknown")
        reason = validation_data.get("reason", "no_reason_provided")

        # 2. Decision Logic
        # We blacklist if the email is confirmed bad (undeliverable) or suspicious (risky)
        if status in ["undeliverable", "risky"]:
            block_reason = f"Automated block: Mails.so flagged as {status} ({reason})"
            
            # 3. Call Listmonk Client to blacklist
            listmonk_response = block_email(email, reason=block_reason)
            
            return {
                "email": email,
                "action": "blacklisted",
                "reason": block_reason,
                "details": {
                    "mails_so": validation_data,
                    "listmonk": listmonk_response
                }
            }

        # 3. If it's deliverable, we do nothing and return success
        return {
            "email": email,
            "action": "none",
            "status": "deliverable",
            "details": {
                "mails_so": validation_data
            }
        }

    except Exception as e:
        # Catch errors from either client and return a 500 error
        raise HTTPException(
            status_code=500, 
            detail=f"Validation coordination failed: {str(e)}"
        )

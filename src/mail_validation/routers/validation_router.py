from fastapi import APIRouter, HTTPException, Query
from mail_validation.utils.mailso_client import validate_email, MailSoError
from mail_validation.models.validation import ValidationResponse

router = APIRouter()


@router.post("/validate-single", response_model=ValidationResponse)
async def validate_only(
    email: str = Query(..., description="The email address to verify"),
):
    try:
        # Perform Validation via Mails.so
        validation_data = validate_email(email)

        return {
            "email": email,
            "status": validation_data.get("result", "unknown"),
            "score": validation_data.get("score", 0),
            "reason": validation_data.get("reason"),
            "details": validation_data,
        }

    except MailSoError as e:
        # Handle known external API failures (e.g., Mails.so is down or API key is invalid)
        raise HTTPException(
            status_code=502,  # Bad Gateway is better for external API failures
            detail=f"Email validation service error: {str(e)}",
        )
    # Note: We NO LONGER catch generic 'Exception' here.
    # If a code bug exists, FastAPI will return a 500 automatically,
    # and you will see the full, helpful Traceback in your terminal.

from typing import Dict, Any
import requests
from requests import Response
from mail_validation.settings import settings

# standard timeout for external API calls
DEFAULT_TIMEOUT = 10

class MailSoError(Exception):
    """Custom exception for Mails.so API issues."""
    pass

def _raise_for_status(resp: Response) -> None:
    """
    Checks the response status and raises a MailSoError with 
    the response text if the request failed.
    """
    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        raise MailSoError(f"mails.so API error: {e} - {resp.text}") from e

def validate_email(email: str) -> Dict[str, Any]:
    """
    Validate a single email using the Mails.so API.
    
    Returns:
        Dict: The parsed JSON response containing 'result' (deliverable, undeliverable, or risky).
    
    Raises:
        MailSoError: If the API key is missing, a network error occurs, or the API returns an error.
    """
    api_key = settings.mails_so_api_key
    
    # Critical: Must include the full path /v1/validate
    api_url = "https://api.mails.so/v1/validate"

    assert api_key, "MAILS_SO_API_KEY is not set in settings"

    # Mails.so uses 'x-api-key' for authentication
    headers = {
        "x-api-key": api_key, 
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    # The payload expected by the Mails.so POST endpoint
    payload = {"email": email}

    try:
        resp = requests.post(
            api_url, 
            json=payload, 
            headers=headers, 
            timeout=DEFAULT_TIMEOUT
        )
    except requests.RequestException as e:
        raise MailSoError(f"Network error when calling mails.so: {e}") from e

    # Check for HTTP errors (4xx, 5xx)
    _raise_for_status(resp)

    try:
        # Return the JSON data to the router
        return resp.json()
    except ValueError as e:
        raise MailSoError(f"Invalid JSON response from mails.so: {resp.text}") from e

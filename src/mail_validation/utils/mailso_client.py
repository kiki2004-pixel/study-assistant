from typing import Dict, Any
import httpx
from mail_validation.settings import settings

# Standard timeout for external API calls in 2026
DEFAULT_TIMEOUT = 10

class MailSoError(Exception):
    """Custom exception for Mails.so API issues."""
    pass

def validate_email(email: str) -> Dict[str, Any]:
    """
    Validate a single email using the Mails.so API via HTTPX.
    
    Returns:
        Dict: The parsed JSON response containing 'result'.
    """
    api_key = settings.mails_so_api_key
    # Critical: Matches the exact path used in E2E mocks
    api_url = "https://api.mails.so/v1/validate"

    assert api_key, "MAILS_SO_API_KEY is not set in settings"

    # Mails.so 2026 standard headers
    headers = {
        "x-mails-api-key": api_key, 
        "Accept": "application/json",
    }

    # For single validation, Mails.so uses GET with query parameters
    params = {"email": email}

    try:
        # Use httpx.get to ensure compatibility with respx tests
        resp = httpx.get(
            api_url, 
            params=params, 
            headers=headers, 
            timeout=DEFAULT_TIMEOUT
        )
        
        # Check for HTTP errors (4xx, 5xx)
        resp.raise_for_status()
        
        # Return the JSON data to the router
        return resp.json()

    except httpx.HTTPStatusError as e:
        # Specific handling for 4xx/5xx responses
        raise MailSoError(f"Mails.so API error: {e.response.status_code} - {e.response.text}")
    except httpx.RequestError as e:
        # Specific handling for network/timeout issues
        raise MailSoError(f"Network error when calling Mails.so: {str(e)}")
    except ValueError as e:
        raise MailSoError(f"Invalid JSON response from Mails.so")

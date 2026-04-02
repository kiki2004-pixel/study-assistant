from typing import Dict, Any, Optional
import requests
from requests import Response
from scrub.settings import Settings, get_settings

DEFAULT_TIMEOUT = 10


class ListmonkError(Exception):
    """Custom exception for Listmonk API issues."""

    pass


def _raise_for_status(resp: Response) -> None:
    try:
        resp.raise_for_status()
    except requests.HTTPError as e:
        raise ListmonkError(f"Listmonk API error: {e} - {resp.text}") from e


def block_email(
    email: str,
    reason: str = None,
    settings: Optional[Settings] = None,
) -> Dict[str, Any]:
    """
    Adds `email` to Listmonk's global blocklist using settings from settings.py.
    """

    resolved_settings = settings or get_settings()
    api_url = resolved_settings.listmonk_url
    api_key = resolved_settings.listmonk_pass

    if not api_key:
        raise ListmonkError("LISTMONK_PASS (listmonk_pass) is not set in settings")

    url = f"{api_url.rstrip('/')}/api/subscribers/blocklist"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }

    payload = {"emails": [email]}
    if reason:
        payload["reason"] = reason

    try:
        # Per the TODO in Issue #1, using PUT to update the blocklist
        resp = requests.put(url, json=payload, headers=headers, timeout=DEFAULT_TIMEOUT)
    except requests.RequestException as e:
        raise ListmonkError(f"Network error when calling Listmonk: {e}") from e

    _raise_for_status(resp)

    try:
        data = resp.json()
    except ValueError:
        # Return raw text if JSON not provided
        data = {"raw": resp.text}

    return data

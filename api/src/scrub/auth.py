import logging
import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from scrub.settings import get_settings

logger = logging.getLogger(__name__)
bearer_scheme = HTTPBearer()


async def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """Validate a bearer token via Zitadel's userinfo endpoint.

    Works with both opaque and JWT access tokens — Zitadel handles validation
    and returns the user's claims directly.
    """
    s = get_settings()
    token = credentials.credentials
    userinfo_url = f"{s.zitadel_domain}/oidc/v1/userinfo"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                userinfo_url,
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0,
            )
        except httpx.RequestError as e:
            logger.error("Userinfo request failed: %s", e)
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Authentication service unreachable.",
            )

    if response.status_code == 401:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired.",
        )

    if response.status_code != 200:
        logger.warning("Userinfo returned %s: %s", response.status_code, response.text)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
        )

    return response.json()

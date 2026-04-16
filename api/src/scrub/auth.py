import logging
import time
import httpx
import jwt
from typing import Optional
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader, HTTPBearer, HTTPAuthorizationCredentials

from scrub.settings import get_settings

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)
_API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)

# JWKS cache: (keys_dict, fetched_at_timestamp)
_jwks_cache: tuple[dict, float] | None = None
_JWKS_TTL = 3600  # refresh public keys every hour


# ---------------------------------------------------------------------------
# JWKS helpers
# ---------------------------------------------------------------------------


def _get_jwks() -> dict:
    global _jwks_cache
    now = time.monotonic()

    if _jwks_cache and (now - _jwks_cache[1]) < _JWKS_TTL:
        return _jwks_cache[0]

    s = get_settings()
    try:
        response = httpx.get(s.zitadel_jwks_url, timeout=5.0)
        response.raise_for_status()
    except httpx.HTTPError as e:
        if _jwks_cache:
            logger.warning("JWKS refresh failed, using cached keys: %s", e)
            return _jwks_cache[0]
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service unreachable.",
        )

    jwks = response.json()
    _jwks_cache = (jwks, now)
    return jwks


def _find_key(jwks: dict, token: str) -> str:
    import json

    try:
        header = jwt.get_unverified_header(token)
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
        ) from e

    kid = header.get("kid")
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return json.dumps(key)

    # kid not found — JWKS may be stale, force a refresh and retry once
    global _jwks_cache
    _jwks_cache = None
    jwks = _get_jwks()
    for key in jwks.get("keys", []):
        if key.get("kid") == kid:
            return json.dumps(key)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
    )


# ---------------------------------------------------------------------------
# JWT auth (Zitadel OIDC)
# ---------------------------------------------------------------------------


async def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """Validate a JWT access token locally using Zitadel's public JWKS."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    s = get_settings()
    token = credentials.credentials
    jwks = _get_jwks()

    try:
        signing_key = jwt.algorithms.RSAAlgorithm.from_jwk(_find_key(jwks, token))
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=s.zitadel_client_id,
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or expired.",
        )
    except jwt.InvalidTokenError:
        logger.warning("JWT validation failed for token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
        )

    return claims


# ---------------------------------------------------------------------------
# API key auth (integrations)
# ---------------------------------------------------------------------------


def verify_api_key(
    api_key: Optional[str] = Security(_API_KEY_HEADER),
) -> dict:
    """Validate an X-API-Key against the database.

    Returns a claims-compatible dict so routes don't need to branch on auth
    method. The 'sub' is set to 'apikey:<key_id>' for usage tracking.
    """
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated.",
        )

    from scrub.settings import settings
    from scrub.models.api_key_store import ApiKeyStore
    from scrub.models.user_store import UserStore

    key_store = ApiKeyStore(settings.scrub_db_url)
    key = key_store.lookup(api_key)

    if key is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or revoked API key.",
        )

    user_store = UserStore(settings.scrub_db_url)
    with user_store._engine.begin() as conn:
        from scrub.models.user_store import users
        from sqlalchemy import select

        row = conn.execute(select(users).where(users.c.id == key.user_id)).first()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or revoked API key.",
        )

    return {
        "sub": row[1],  # user sub
        "email": row[2],
        "name": row[3],
        "auth_method": "api_key",
    }


# ---------------------------------------------------------------------------
# Combined auth — accepts JWT or API key (for validation routes)
# ---------------------------------------------------------------------------


async def verify_any_auth(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    api_key: Optional[str] = Security(_API_KEY_HEADER),
) -> dict:
    """Accept either a Bearer JWT or an X-API-Key header.

    Tries JWT first (no DB hit), falls back to API key lookup.
    Raises 401 if neither is provided or valid.
    """
    if credentials is not None:
        return await verify_token(credentials)

    if api_key is not None:
        return verify_api_key(api_key)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Provide a Bearer token or X-API-Key.",
    )

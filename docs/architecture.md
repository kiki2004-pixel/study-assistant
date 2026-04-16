# Architecture

## Overview

Scrub is a monorepo with two deployable services:

| Component | Directory | Runtime |
|-----------|-----------|---------|
| API + worker | `api/` | Python 3.12, FastAPI, Celery |
| Web UI | `web/` | React Router 7, Vite, served via nginx |

The web UI talks to the API over HTTP. No shared code.

---

## Backend (`api/`)

```
api/
├── src/
│   └── scrub/
│       ├── routers/              # HTTP route handlers
│       │   ├── validation_router.py    # POST /validation/*
│       │   ├── history_router.py       # GET|DELETE /validation/history/*
│       │   ├── api_key_router.py       # GET|POST|DELETE /api-keys
│       │   ├── user_router.py          # GET /context
│       │   ├── webhook_router.py       # POST|DELETE|GET /webhooks/*
│       │   ├── listmonk_router.py      # POST /listmonk/*
│       │   └── postmark_router.py      # POST /postmark
│       ├── services/
│       │   ├── validation_service.py   # Orchestrates syntax + DNS check
│       │   ├── dns_service.py          # Async DNS MX lookup (dnspython)
│       │   └── webhook_service.py      # Outbound webhook delivery
│       ├── storage/
│       │   ├── user_store.py           # users, user_stats tables
│       │   ├── history_store.py        # validation_history table
│       │   ├── api_key_store.py        # api_keys table
│       │   ├── webhook_store.py        # webhook_registrations table
│       │   └── watermark_store.py      # listmonk_watermark table
│       ├── models/               # Pydantic request/response schemas
│       ├── validators/
│       │   └── email_syntax.py         # RFC-compliant syntax check
│       ├── jobs/
│       │   └── celery_app.py           # Celery tasks + beat schedule
│       ├── auth.py               # JWT validation + API key auth
│       └── settings.py           # Pydantic Settings (reads from env)
├── alembic/                      # Migrations (all tables)
│   └── versions/
│       ├── 20260415_0001_init_scrub_schema.py
│       └── 20260415_0002_add_api_keys.py
└── Dockerfile
```

### Authentication

Two auth methods coexist, handled in `auth.py`:

```
Bearer token → verify_token()
  - Fetches Zitadel JWKS once, caches 1hr
  - Validates JWT signature locally (RS256)
  - Auto-refreshes on kid mismatch (key rotation)
  - Returns decoded claims dict

X-API-Key → verify_api_key()
  - SHA-256 hashes the key
  - Looks up in api_keys table
  - Updates last_used_at
  - Returns user claims dict (same shape as JWT claims)

verify_any_auth()
  - Tries Bearer first (no DB hit)
  - Falls back to X-API-Key
  - Used on validation endpoints to accept both
```

### Request flow — single email validation

```
POST /validation/validate-single?email=...
  → verify_any_auth()            (JWT or API key)
  → validate_email_internal()
      → email_syntax.py          (RFC syntax check — fast path)
      → dns_service.check_mx()   (async DNS lookup, 2s timeout)
  ← ValidationResponse
  → background: history_store.save(user_id=sub)
  → background: dispatch_webhook()
  → background: user_store.record_validation()
```

### Listmonk hygiene job

```
Celery beat (every VALIDATION_POLL_INTERVAL_SECONDS)
  → start_scheduler task
  → fetch subscribers from Listmonk (paginated, from watermark)
  → validate each email
  → bulk unsubscribe invalid addresses via Listmonk
  → watermark_store.update(last_created_at)
```

### Database

All tables managed by Alembic.

| Table | Purpose |
|-------|---------|
| `users` | User identities (sub, email, name from Zitadel) |
| `user_stats` | Monthly validation usage per user |
| `api_keys` | Hashed API keys with owner, name, active flag |
| `validation_history` | Per-email validation results, scoped by user_id |
| `webhook_registrations` | Registered webhook URLs + HMAC secrets |
| `listmonk_watermark` | Cursor for incremental Listmonk subscriber sync |

---

## Frontend (`web/`)

React Router 7 SPA. No SSR — built to a static bundle served by nginx.

```
web/
├── api/
│   ├── client.ts          # fetch wrapper — injects Bearer token automatically
│   ├── api-keys.ts        # API key CRUD calls
│   └── ...                # other domain API modules
├── app/
│   ├── routes/
│   │   ├── _authenticated.tsx    # Layout guard — redirects to login if not authed
│   │   ├── dashboard.tsx
│   │   ├── api.tsx               # API key management page
│   │   ├── docs.tsx              # User-facing API reference
│   │   └── settings/
│   ├── components/
│   │   └── modals/
│   │       └── create-api-key-modal.tsx
│   └── root.tsx           # ChakraUI + AuthProvider setup
├── lib/
│   ├── auth.ts            # oidcConfig
│   └── token-store.ts     # In-memory token for API calls
└── Dockerfile             # Multi-stage: bun build → nginx:alpine
```

### Auth flow

```
1. User hits protected route → _authenticated.tsx checks useAuth()
2. Not authed → auth.signinRedirect() → Zitadel login page
3. Zitadel redirects to /auth/callback with ?code=...
4. auth.callback.tsx exchanges code for tokens
5. _authenticated.tsx runs useLayoutEffect → setToken(access_token)
6. All api/* calls include Authorization: Bearer <token> automatically
```

`VITE_*` env vars are baked into the bundle at Docker build time via build args. They cannot be changed at runtime.

---

## Environment variables

### API (`api/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `SCRUB_DB_URL` | PostgreSQL connection string | yes |
| `ZITADEL_DOMAIN` | Zitadel base URL | yes |
| `ZITADEL_JWKS_URL` | JWKS endpoint for JWT validation | yes |
| `ZITADEL_CLIENT_ID` | Expected `aud` claim in tokens | yes |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowed origins | yes |
| `CELERY_BROKER_URL` | Redis URL for Celery | yes |
| `CELERY_RESULT_BACKEND` | Redis URL for Celery results | yes |
| `LISTMONK_URL` | Listmonk internal URL | yes |
| `LISTMONK_USER` / `LISTMONK_PASS` | Listmonk credentials | yes |
| `LISTMONK_LIST_ID` | Target list ID for hygiene job | yes |
| `POSTMARK_WEBHOOK_SECRET` | Validates inbound Postmark events | yes |
| `SENTRY_DSN` | Sentry error tracking (blank to disable) | no |
| `VALIDATION_BATCH_SIZE` | Emails per Celery task | no (default: 250) |

### Web (`web/.env` dev / Docker build args prod)

| Variable | Description |
|----------|-------------|
| `VITE_OIDC_AUTHORITY` | Zitadel instance URL |
| `VITE_OIDC_CLIENT_ID` | OIDC client ID (SPA — no secret) |
| `VITE_OIDC_REDIRECT_URI` | Post-login redirect |
| `VITE_OIDC_POST_LOGOUT_REDIRECT_URI` | Post-logout redirect |
| `VITE_API_BASE_URL` | API base URL (empty in dev — Vite proxies `/backend`) |

---

## Infrastructure services

| Service | Purpose | Port |
|---------|---------|------|
| `scrub_db` | PostgreSQL for API | 5432 |
| `redis` | Celery broker + result backend | 6379 |
| `zitadel` | OIDC identity provider | 8080 |
| `listmonk_app` | Newsletter platform | 9000 |
| `prometheus` | Metrics scraper | 9090 |
| `grafana` | Metrics dashboard | 3001 |

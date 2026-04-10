# Architecture

## Overview

Scrub is a monorepo with two deployable components:

| Component | Directory | Runtime |
|-----------|-----------|---------|
| API + worker | `server/` | Python 3.12, FastAPI, Celery |
| Web UI | `web/` | React Router 7, Vite, served via nginx |

They share nothing at the code level — the web UI talks to the API over HTTP.

## Backend (`server/`)

```
server/
├── src/
│   └── scrub/
│       ├── routers/          # HTTP route handlers (FastAPI)
│       ├── services/         # Business logic
│       │   ├── dns_service.py          # Async DNS MX lookup (dnspython)
│       │   ├── validation_service.py   # Orchestrates syntax + DNS check
│       │   ├── Listmonk.py             # Listmonk API client (httpx)
│       │   └── webhook_service.py      # Outbound webhook delivery
│       ├── models/           # Pydantic request/response schemas
│       ├── validators/
│       │   └── email_syntax.py         # RFC-compliant syntax check
│       ├── jobs/
│       │   └── celery_app.py           # Celery tasks + beat schedule
│       ├── storage/
│       │   ├── watermark_store.py      # Tracks last-processed subscriber
│       │   └── webhook_store.py        # Registered webhook endpoints
│       ├── utils/
│       │   └── listmonk_client.py      # (legacy — see note below)
│       └── settings.py       # Pydantic Settings (reads from env)
├── alembic/                  # Alembic migrations (watermark table)
├── e2e_tests/                # Integration tests against a live stack
└── Dockerfile                # Build context: server/
```

### Request flow — single email validation

```
POST /validation/validate-single?email=...
  → validation_router.py
  → validation_service.validate_email_internal()
      → email_syntax.py          (RFC syntax check)
      → dns_service.check_mx()   (async DNS lookup, 2s timeout)
  ← ValidationResponse { valid, status, reason }
```

### Listmonk hygiene job

```
Celery beat (every N seconds)
  → celery_app.start_scheduler
  → Listmonk.subscribers()         (paginated, from watermark)
  → validation_service (per email)
  → Listmonk.add_subs_to_blocklist() (bulk unsubscribe)
  → watermark_store.update()
```

### Storage

| Store | Backend | Managed by |
|-------|---------|------------|
| `watermark_store` | Postgres | Alembic |
| `webhook_store` | Postgres | `metadata.create_all()` at startup |

> **Note:** The webhook store table is created via `create_all()` at startup, not tracked by Alembic. Any schema changes to `webhook_registrations` must be applied manually or by adding an Alembic migration.

## Frontend (`web/`)

React Router 7 SPA. Auth via OIDC (Zitadel). No SSR — built to a static bundle and served by nginx.

```
web/
├── app/
│   ├── routes/
│   │   ├── home.tsx             # Public landing page
│   │   ├── dashboard.tsx        # Authenticated dashboard
│   │   └── auth.callback.tsx    # OIDC redirect handler
│   └── components/
│       ├── navbar/
│       └── Footer.tsx
└── Dockerfile                   # Multi-stage: bun build → nginx:alpine
```

VITE_* env vars are baked into the build at image build time (passed as Docker build args in CI).

## Environment variable ownership

| Variable | Owner | Where set |
|----------|-------|-----------|
| `API_KEY` | server | `server/.env` |
| `LISTMONK_URL`, `LISTMONK_USER`, `LISTMONK_PASS`, `LISTMONK_LIST_ID` | server | `server/.env` |
| `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | server | `server/.env` |
| `WATERMARK_DB_URL` | server | `server/.env` |
| `VALIDATION_BATCH_SIZE`, `VALIDATION_POLL_INTERVAL_SECONDS` | server | `server/.env` |
| `GF_SECURITY_ADMIN_USER`, `GF_SECURITY_ADMIN_PASSWORD` | grafana | `.env` (root) |
| `LISTMONK_ADMIN_USER`, `LISTMONK_ADMIN_PASSWORD` | listmonk bootstrap | `.env` (root) |
| `VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, `VITE_OIDC_REDIRECT_URI` | web | `web/.env` (dev) / build args (CI) |

## Docker build contexts

| Image | Build context | Compose service |
|-------|--------------|-----------------|
| API | `server/` | `scrub` |
| Worker | `server/` (same image, different CMD) | `celery-worker` |
| Web | `web/` | *(not in compose — deploy separately)* |

## Infrastructure services (docker-compose only)

| Service | Purpose | Port |
|---------|---------|------|
| `redis` | Celery broker + result backend | 6379 |
| `listmonk_app` | Newsletter platform | 9000 |
| `listmonk_db` | Postgres for listmonk + watermarks | 5432 |
| `zitadel` | OIDC identity provider | 8080 |
| `zitadel-db` | Postgres for zitadel | — |
| `prometheus` | Metrics scraper | 9090 |
| `grafana` | Metrics dashboard | 3001 |

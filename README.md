
# Mail-Validator
FastAPI service that performs syntax + DNS MX email validation and can automate Listmonk list hygiene.

## What it does
- Provides HTTP endpoints to validate single emails or bulk lists (syntax + DNS MX).
- Optionally runs a Listmonk job that fetches new subscribers, validates with the same syntax + DNS MX pipeline, and unsubscribes invalid emails.
- Uses a watermark (created_at + id) so each Listmonk run only processes new subscribers.

## Setup


```bash
cp .env.example .env
cp api/.env.example api/.env
cp web/.env.example web/.env
make run
```

## Commands

```bash
make run           # Docker services + API + web dev servers
make stop          # stop all services
make deps          # infrastructure only (listmonk, redis, zitadel)
make api-dev       # API dev server (port 3000)
make web-dev       # web dev server (port 5173)
make worker-dev    # Celery worker
make test          # unit tests
make migrate       # apply DB migrations
make clean         # stop + remove volumes

Returns a validation response. Invalid syntax returns HTTP 422 with a structured error. DNS MX failures return HTTP 200 with status=undeliverable.

### POST /validation/validate-bulk
Request body:
```
{
  "emails": ["a@example.com", "b@example.com"],
  "response_mode": "all" | "invalid_only" | "summary_only",
  "dedupe": false
}
```

## Listmonk validation job
This job fetches new subscribers (watermark-based), validates with the same API pipeline, and unsubscribes invalid emails in bulk.

### Required env vars (API token recommended)
- LISTMONK_BASE_URL
- LISTMONK_API_USER
- LISTMONK_API_TOKEN

Compatibility: LISTMONK_URL / LISTMONK_USER / LISTMONK_PASS are also accepted for BasicAuth.

### Optional env vars
- LISTMONK_LIST_ID (comma-separated IDs; when set, name-based exclusions are ignored)
- LISTMONK_EXCLUDE_NAME_SUBSTRINGS (default: test,sample)
- VALIDATION_BATCH_SIZE (default: 250)
- VALIDATION_POLL_INTERVAL_SECONDS (default: 300; 0 runs once)
- CELERY_BROKER_URL (default: redis://localhost:6379/0)
- CELERY_RESULT_BACKEND (default: CELERY_BROKER_URL)
- CELERY_RESTART_DELAY_SECONDS (default: 10)
- WATERMARK_DB_URL (required, Postgres URL for watermark storage)
- MX_CHECK_ENABLED (default: true)
- MX_TIMEOUT_SECONDS (default: 2.0)

### Run once
```
python -m mail_validation.jobs.listmonk_validator

```

## Zitadel

1. `make zitadel` then open http://localhost:8080 (`zitadel-admin@zitadel.localhost` / `Password1!`)
2. Create a project → User Agent app → enable PKCE → redirect URI `http://localhost:5173/auth/callback`
3. Copy the client ID into `VITE_OIDC_CLIENT_ID` in `web/.env`

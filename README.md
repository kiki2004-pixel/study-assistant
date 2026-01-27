# Mail-Validator
FastAPI service that performs syntax + DNS MX email validation and can automate Listmonk list hygiene.

## What it does
- Provides HTTP endpoints to validate single emails or bulk lists (syntax + DNS MX).
- Optionally runs a Listmonk job that fetches new subscribers, validates with the same syntax + DNS MX pipeline, and unsubscribes invalid emails.
- Uses a watermark (created_at + id) so each Listmonk run only processes new subscribers.

## API
### POST /validation/validate-single
Query params:
- email

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

### Run continuously (polling)
```
VALIDATION_POLL_INTERVAL_SECONDS=300 python -m mail_validation.jobs.listmonk_validator
```

### Run continuously (Celery + Redis)
Start Redis:
```
docker run --rm --name some-redis -p 6379:6379 redis:latest
```

Start a worker:
```
uv run celery -A mail_validation.jobs.listmonk_validator.celery_app worker --loglevel=info
```

Kick off the first cycle (the task reschedules itself):
```
uv run celery -A mail_validation.jobs.listmonk_validator.celery_app call mail_validation.listmonk.run_cycle
```

## Local development
### Run the API
```
uv run fastapi dev --reload --port 3000 src/main.py
```

### Local Listmonk (for integration testing)
This repo includes a Listmonk + Postgres setup in `docker-compose.yml`.

1) Add to `.env`
```
LISTMONK_ADMIN_USER=admin
LISTMONK_ADMIN_PASSWORD=admin123
LISTMONK_BASE_URL=http://listmonk:9000
LISTMONK_LIST_ID=1
```

2) Start services
```
docker compose up -d listmonk_db listmonk_app
```

3) Initialize & create a list
- Open http://localhost:9000 and log in with LISTMONK_ADMIN_USER / LISTMONK_ADMIN_PASSWORD
- Create a list and note its ID
- Update LISTMONK_LIST_ID if needed

4) Create an API user and token
- In Listmonk UI: Admin -> Users -> New user
- Assign a role with subscriber read + list membership update permissions
- Copy the token and set:
```
LISTMONK_API_USER=validator
LISTMONK_API_TOKEN=your_api_token
```

5) Run the validation job
```
python -m mail_validation.jobs.listmonk_validator
```

## Migrations
Alembic manages the watermark schema. Set `WATERMARK_DB_URL` and run:
```
alembic upgrade head
```

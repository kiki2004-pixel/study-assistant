# Mail-Validator
FastAPI service that performs syntax-only email validation and can automate Listmonk list hygiene.

## What it does
- Provides HTTP endpoints to validate single emails or bulk lists (syntax-only).
- Optionally runs a Listmonk job that fetches new subscribers, validates syntax, and unsubscribes invalid emails.
- Uses a watermark (created_at + id) so each Listmonk run only processes new subscribers.

## API
### POST /validation/validate-single
Query params:
- email

Returns a validation response. Invalid syntax returns HTTP 422 with a structured error.

### POST /validation/validate-bulk
Request body:
```
{
  "emails": ["a@example.com", "b@example.com"],
  "response_mode": "all" | "invalid_only" | "summary_only",
  "dedupe": false
}
```

## Listmonk syntax validation job
This job fetches new subscribers (watermark-based), validates syntax only, and unsubscribes invalid emails in bulk.

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
- WATERMARK_DB_URL (required, Postgres URL for watermark storage)

### Run once
```
python -m mail_validation.jobs.listmonk_validator
```

### Run continuously (polling)
```
VALIDATION_POLL_INTERVAL_SECONDS=300 python -m mail_validation.jobs.listmonk_validator
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

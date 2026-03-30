# Mail-Validator
FastAPI service that performs syntax + DNS MX email validation and can automate Listmonk list hygiene.

## What it does
- Provides HTTP endpoints to validate single emails or bulk lists (syntax + DNS MX).
- Optionally runs a Listmonk job that fetches new subscribers, validates with the same syntax + DNS MX pipeline, and unsubscribes invalid emails.
- Uses a watermark (created_at + id) so each Listmonk run only processes new subscribers.

## Project structure
```
mail-validation/
├── src/
│   └── mail_validation/
│       ├── routers/          # FastAPI route handlers
│       ├── services/         # Validation, DNS, Listmonk logic
│       ├── models/           # Pydantic request/response models
│       ├── validators/       # Email syntax validation
│       ├── jobs/             # Celery tasks
│       ├── storage/          # Watermark store (Postgres)
│       ├── utils/            # Listmonk API client
│       └── tests/
├── web/                      # React Router SPA (Bun + Vite)
│   └── app/
│       ├── routes/           # home, dashboard, auth.callback
│       └── components/       # Navbar, Footer
├── alembic/                  # DB migrations
├── e2e_tests/                # End-to-end tests
├── docs/                     # Keycloak client config
├── docker-compose.yml
└── prometheus.yml
```

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

### Required env vars
- LISTMONK_URL (default: http://localhost:9000)
- LISTMONK_USER
- LISTMONK_PASS

### Optional env vars
- CELERY_BROKER_URL (default: redis://localhost:6379/0)
- CELERY_RESULT_BACKEND (default: redis://localhost:6379/0)
- WATERMARK_DB_URL (default: sqlite:///./watermarks.db)
- VALIDATION_BATCH_SIZE (default: 250)

### Run continuously (Celery + Redis)
Start dependencies:
```
docker compose up -d listmonk_db listmonk_app redis
```

Start a worker:
```
PYTHONPATH=src \
LISTMONK_URL=http://localhost:9000 \
LISTMONK_USER=your_user \
LISTMONK_PASS=your_password \
uv run celery -A mail_validation.jobs.celery_app worker --loglevel=info
```

Kick off the scheduler:
```
PYTHONPATH=src uv run celery -A mail_validation.jobs.celery_app call start_scheduler
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
LISTMONK_URL=http://localhost:9000
LISTMONK_USER=admin
LISTMONK_PASS=admin123
```

2) Start services
```
docker compose up -d listmonk_db listmonk_app
```

3) Initialize & create a list
- Open http://localhost:9000 and log in with LISTMONK_ADMIN_USER / LISTMONK_ADMIN_PASSWORD
- Create a list and note its ID
- Update LISTMONK_LIST_ID if needed

4) Start the Celery worker and kick off the scheduler as described above

## Web UI

### Keycloak setup
The web app uses OIDC via Keycloak. Import the client config before running the UI.

1. Start Keycloak:
```
docker compose up -d keycloak
```

2. Open http://localhost:8080 and log in (admin / admin)

3. Select your realm, go to **Clients** -> **Import client**, and upload `docs/client.json`

### Running locally
1. Copy the env file:
```
cp web/.env.example web/.env
```

2. Install dependencies:
```
cd web && bun install
```

3. Start the dev server:
```
bun run dev
```

The app will be available at http://localhost:5173.

### Running with Docker
```
docker build -t mail-validation-web web/
docker run -p 5173:80 mail-validation-web
```

## Migrations
Alembic manages the watermark schema. Set `WATERMARK_DB_URL` and run:
```
alembic upgrade head
```

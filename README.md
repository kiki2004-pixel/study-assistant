
# Scrub
FastAPI service that performs syntax + DNS MX email validation and can automate Listmonk list hygiene.

## What it does
- Provides HTTP endpoints to validate single emails or bulk lists (syntax + DNS MX).
- Optionally runs a Listmonk job that fetches new subscribers, validates with the same syntax + DNS MX pipeline, and unsubscribes invalid emails.
- Uses a watermark (created_at + id) so each Listmonk run only processes new subscribers.

## Project structure
```
scrub/
├── src/
│   └── scrub/
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

Start a worker:
```
PYTHONPATH=src \
LISTMONK_URL=http://localhost:9000 \
LISTMONK_USER=your_user \
LISTMONK_PASS=your_password \
uv run celery -A scrub.jobs.celery_app worker --loglevel=info
```

The scheduler runs automatically every `VALIDATION_POLL_INTERVAL_SECONDS` seconds via Celery beat. To trigger it manually, call `GET /validation/trigger` or:
```
PYTHONPATH=src uv run celery -A scrub.jobs.celery_app call start_scheduler
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

Configure the following variables in `web/.env`:
```
VITE_OIDC_AUTHORITY=http://localhost:8080/realms/master
VITE_OIDC_CLIENT_ID=app
VITE_OIDC_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:5173
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
docker build -t scrub-web web/
docker run -p 5173:80 scrub-web
```

## Observability
The stack includes Prometheus and Grafana for metrics.

- Prometheus scrapes `GET /metrics` and is available at http://localhost:9090
- Grafana is available at http://localhost:3001

Start both services:
```
docker compose up -d prometheus grafana
```

Configure Grafana credentials via env vars:
```
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=yourpassword
```

## Migrations
Alembic manages the watermark schema. Set `WATERMARK_DB_URL` and run:
```
alembic upgrade head
```

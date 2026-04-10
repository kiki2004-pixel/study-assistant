
# Scrub

FastAPI service that performs syntax + DNS MX email validation and automates Listmonk list hygiene.

## What it does

- Validates single emails or bulk lists (syntax + DNS MX check)
- Runs a background Listmonk job that fetches new subscribers, validates them, and unsubscribes invalid emails
- Uses a watermark (created_at + id) so each run only processes new subscribers
- Exposes Prometheus metrics at `/metrics`

## Monorepo layout

```
scrub/
├── server/                   # Python backend (FastAPI + Celery)
│   ├── src/scrub/            # Application source
│   │   ├── routers/          # FastAPI route handlers
│   │   ├── services/         # Validation, DNS, Listmonk logic
│   │   ├── models/           # Pydantic request/response models
│   │   ├── validators/       # Email syntax validation
│   │   ├── jobs/             # Celery tasks
│   │   ├── storage/          # Watermark store (Postgres)
│   │   └── utils/
│   ├── alembic/              # DB migrations
│   ├── e2e_tests/
│   ├── Dockerfile
│   └── .env.example          # Backend env vars
├── web/                      # React Router SPA (Bun + Vite)
│   ├── app/
│   │   ├── routes/           # home, dashboard, auth.callback
│   │   └── components/
│   ├── Dockerfile
│   └── .env.example          # Frontend env vars (VITE_*)
├── docs/                     # Architecture, API reference, deployment guides
├── docker-compose.yml        # Full local stack
├── .env.example              # Infrastructure env vars (Grafana, Listmonk bootstrap)
└── prometheus.yml
```

<<<<<<< HEAD
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
=======
See [`docs/`](docs/) for detailed guides:
- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Deployment](docs/deployment.md)
>>>>>>> 354433c (fix: move project files into server/ subdirectory)

## Quick start

### Full stack (Docker)

```bash
cp .env.example .env                  # infrastructure vars
cp server/.env.example server/.env    # backend vars
cp web/.env.example web/.env          # frontend vars

docker compose up -d
```

<<<<<<< HEAD
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

=======
- API: http://localhost:3000
- Web UI: *(served via nginx inside the web container)*
- Listmonk: http://localhost:9000
- Grafana: http://localhost:3001
- Keycloak: http://localhost:8080

### Backend dev server

```bash
cd server
cp .env.example .env
uv run fastapi dev src/main.py --reload --port 3000
>>>>>>> 354433c (fix: move project files into server/ subdirectory)
```

### Frontend dev server

```bash
cd web
cp .env.example .env
bun install
bun run dev      # http://localhost:5173
```

## Keycloak setup (Web UI)

1. Start Keycloak: `docker compose up -d keycloak`
2. Open http://localhost:8080 and log in (`admin` / `admin`)
3. Select your realm → **Clients** → **Import client** → upload `docs/client.json`

## Migrations

```bash
# From repo root
alembic -c server/alembic.ini upgrade head

# Or from server/
cd server && alembic upgrade head
```

## Celery worker (local)

```bash
cd server
PYTHONPATH=src uv run celery -A scrub.jobs.celery_app worker --loglevel=info
```

Trigger the scheduler manually:
```bash
cd server && PYTHONPATH=src uv run celery -A scrub.jobs.celery_app call start_scheduler
```
Or via HTTP: `GET /validation/trigger`

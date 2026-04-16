# Deployment

## Local development

### Prerequisites

- Docker + Docker Compose
- Bun (web)
- Python 3.12 + uv (API)
- A running Zitadel instance (local Docker or shared dev)

### Setup

```bash
cp api/.env.example api/.env
cp web/.env.example web/.env
# Fill in values — see architecture.md for variable reference
```

### Start infrastructure

```bash
docker compose up -d
```

This starts: PostgreSQL, Redis, Zitadel, Listmonk, Prometheus, Grafana.

### Run the API locally

```bash
cd api
uv run fastapi dev src/main.py --port 3000
```

### Run the web locally

```bash
cd web
bun install
bun dev
```

Vite proxies `/backend/*` → `http://localhost:3000` so no CORS config is needed locally.

---

## Migrations

All tables are managed by Alembic. Run from `api/`:

```bash
# Apply all pending migrations
make migrate

# Generate a new migration after changing a store
make migrate-new

# Check current state
SCRUB_DB_URL=<url> .venv/bin/alembic current
```

Migrations run against `SCRUB_DB_URL`. In CI, they run inside the container network where `scrub_db` is resolvable. Locally, either use the Docker network or override with `localhost:5432`.

---

## Docker

### Build images manually

```bash
# API
docker build api/ \
  --build-arg GIT_COMMIT=$(git rev-parse HEAD) \
  --build-arg APP_VERSION=local \
  -t scrub-api:local

# Web
docker build web/ \
  --build-arg VITE_OIDC_AUTHORITY=http://localhost:8080 \
  --build-arg VITE_OIDC_CLIENT_ID=<client_id> \
  --build-arg VITE_OIDC_REDIRECT_URI=http://localhost:5173/auth/callback \
  --build-arg VITE_OIDC_POST_LOGOUT_REDIRECT_URI=http://localhost:5173 \
  -t scrub-web:local
```

### Required runtime env vars (API container)

```env
SCRUB_DB_URL=postgresql+psycopg2://scrub:scrub@scrub_db:5432/scrub
ZITADEL_DOMAIN=https://id.thescrub.app
ZITADEL_JWKS_URL=https://id.thescrub.app/oauth/v2/keys
ZITADEL_CLIENT_ID=<client_id>
CORS_ALLOWED_ORIGINS=https://thescrub.app
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
LISTMONK_URL=http://listmonk:9000
LISTMONK_USER=<user>
LISTMONK_PASS=<pass>
LISTMONK_LIST_ID=1
POSTMARK_WEBHOOK_SECRET=<secret>
```

---

## CI/CD

Images are built and pushed to GHCR via `.github/workflows/build.yml`.

Change detection is VERSIONS-file based — only rebuilds components whose version changed:

```
# VERSIONS file
api=2026.04.001
web=2026.04.002
```

Bump a version line on `main` to trigger a build for that component.

| Branch | Tag suffix | Environment |
|--------|-----------|-------------|
| `main` | `-alpha` | Development |
| `prod` | *(none)* | Production |

### Image tags

| Image | Dev tag | Prod tag |
|-------|---------|----------|
| API | `ghcr.io/nerd-zero/scrub-api:2026.04.001-alpha` | `ghcr.io/nerd-zero/scrub-api:2026.04.001` |
| Web | `ghcr.io/nerd-zero/scrub:2026.04.002-alpha` | `ghcr.io/nerd-zero/scrub:2026.04.002` |

`VITE_*` build args are computed in the `detect` job and passed to the `build-web` step. Dev uses `id.nerdzero.rocks`, prod uses `id.thescrub.app`.

---

## Zitadel setup

The web app uses a **User Agent** (SPA) OIDC application — Authorization Code + PKCE, no client secret.

To register a new Zitadel application:

```bash
cd api
bash scripts/create-web-client.sh \
  -t <personal_access_token> \
  -z https://id.thescrub.app \
  -r https://thescrub.app/auth/callback \
  -l https://thescrub.app
```

The script outputs the `VITE_OIDC_CLIENT_ID` to set in your web build args.

For local development, use `-z http://localhost:8080`.

---

## Observability

Prometheus scrapes `GET /metrics` on the API container (port 3000).

### Metrics available

| Metric | Description |
|--------|-------------|
| `scrub_emails_total` | Validation outcomes by endpoint/status/layer |
| `scrub_duration_seconds` | Latency histogram by endpoint |
| `scrub_bulk_size` | Bulk request size distribution |
| `scrub_duplicates_removed_total` | Dedup counter |
| `postmark_bounce_events_total` | Postmark bounce events |

Grafana dashboard: import `grafana/scrub-dashboard.json` → select Prometheus data source.

---

## Database backup

No automated backup is configured. The PostgreSQL volume (`scrub_db_data`) should be snapshotted at the infrastructure level before any migration or deploy.

```bash
# Manual dump
docker exec scrub_db pg_dump -U scrub scrub > backup.sql
```

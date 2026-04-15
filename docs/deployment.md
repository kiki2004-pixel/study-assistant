# Deployment

## Environment files

The monorepo uses three env files:

| File | Purpose | Who reads it |
|------|---------|-------------|
| `.env` | Infrastructure vars (Grafana, Listmonk bootstrap) | docker-compose auto-load |
| `server/.env` | Backend vars (API key, Listmonk connection, Celery, DB) | `scrub` + `celery-worker` containers |
| `web/.env` | Frontend OIDC vars (dev only — baked into build in CI) | Vite dev server |

Set up:
```bash
cp .env.example .env
cp server/.env.example server/.env
cp web/.env.example web/.env
```

Edit each file before starting services.

---

## Docker

### Build images

```bash
# Backend
docker build -t scrub server/

# Frontend
docker build \
  --build-arg VITE_OIDC_AUTHORITY=https://auth.example.com/realms/scrub \
  --build-arg VITE_OIDC_CLIENT_ID=app \
  --build-arg VITE_OIDC_REDIRECT_URI=https://app.example.com/auth/callback \
  --build-arg VITE_OIDC_POST_LOGOUT_REDIRECT_URI=https://app.example.com \
  -t scrub-web web/
```

### Full local stack

```bash
docker compose up -d
```

Services and ports:

| Service | URL |
|---------|-----|
| API | http://localhost:3000 |
| Listmonk | http://localhost:9000 |
| Keycloak | http://localhost:8080 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 |

Start only dependencies (for local backend dev):
```bash
docker compose up -d listmonk_db listmonk_app redis keycloak
```

---

## CI/CD

Images are built and pushed to GHCR via `.github/workflows/build-dev.yaml`.

| Branch | Tag suffix | Environment |
|--------|-----------|-------------|
| `main` | `-alpha` | Development |
| `uat` | `-beta` | UAT |
| `prod` | *(none)* | Production |

Change detection is path-based:
- Changes under `server/**` → rebuild `ghcr.io/nerd-zero/scrub`
- Changes under `web/**` → rebuild `ghcr.io/nerd-zero/scrub-web`

VITE_* variables are passed as Docker build args in the deploy job. They are baked into the static bundle at build time and are not runtime configurable.

---

## Database migrations

Alembic manages the `listmonk_watermark` table.

```bash
# Apply all pending migrations (from repo root)
alembic -c server/alembic.ini upgrade head

# Generate a new migration
alembic -c server/alembic.ini revision --autogenerate -m "description"

# Check current state
alembic -c server/alembic.ini current
```

Set `SCRUB_DB_URL` before running. Default in docker-compose:
```
postgresql+psycopg2://listmonk:listmonk@listmonk_db:5432/listmonk
```

> **Note:** The `webhook_registrations` table is created by the API at startup via `metadata.create_all()`. It is not tracked by Alembic.

---

## Keycloak

The web UI uses OIDC via Keycloak. A pre-configured client definition is at `docs/client.json`.

Import it after first start:
1. Open http://localhost:8080 → log in (`admin` / `admin`)
2. Select your realm → **Clients** → **Import client** → upload `docs/client.json`

The client is configured for `http://localhost:5173` (local dev). For production, create a new client or update the redirect URIs to match your deployed URL.

Key client settings:
- Client ID: `app`
- Protocol: `openid-connect`
- Public client (no secret)
- PKCE: `S256`
- Standard flow only (no implicit, no device, no service accounts)

---

## Observability

Prometheus scrapes `GET /metrics` on the API container. The Grafana dashboard definition is at `grafana/scrub-dashboard.json`.

Import the dashboard:
1. Open http://localhost:3001 → log in
2. **Dashboards** → **Import** → upload `grafana/scrub-dashboard.json`
3. Select the Prometheus data source

Grafana credentials are set via `GF_SECURITY_ADMIN_USER` and `GF_SECURITY_ADMIN_PASSWORD` in root `.env`.

# Scrub

Email validation service — syntax + DNS MX checks with Listmonk hygiene automation.

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
make lint          # format api (ruff) and web (prettier)
make migrate       # apply DB migrations
make clean         # stop + remove volumes
```

## Zitadel

1. `make zitadel` then open http://localhost:8080 (`zitadel-admin@zitadel.localhost` / `Password1!`)
2. Create a project → User Agent app → enable PKCE → redirect URI `http://localhost:5173/auth/callback`
3. Copy the client ID into `VITE_OIDC_CLIENT_ID` in `web/.env`

.PHONY: run stop restart logs \
        api web worker deps \
        api-dev web-dev \
        test test-e2e lint typecheck \
        migrate migrate-new \
        zitadel setup-web-client setup-api-client \
        clean

# ── Full stack ────────────────────────────────────────────────────────────────

run:
	docker compose up -d
	$(MAKE) -j2 api-dev web-dev

stop:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

# ── Individual services ───────────────────────────────────────────────────────

api:
	docker compose up -d scrub

web:
	docker compose up -d web

worker:
	docker compose up -d celery-worker

deps:
	docker compose up -d listmonk_db listmonk_app redis zitadel

zitadel:
	docker compose up -d zitadel

# ── Local dev servers (outside Docker) ───────────────────────────────────────

api-dev:
	cd api && uv run fastapi dev src/main.py --reload --port 3000

web-dev:
	cd web && bun run dev

worker-dev:
	cd api && PYTHONPATH=src uv run celery -A scrub.jobs.celery_app worker --loglevel=info

# ── Testing ───────────────────────────────────────────────────────────────────

test:
	cd api && uv run pytest -m "not e2e"

test-e2e:
	cd api && uv run pytest -m e2e

# ── Linting & type checking ───────────────────────────────────────────────────

lint:
	cd api && uv run ruff check src

typecheck:
	cd web && bun run typecheck

# ── Migrations ────────────────────────────────────────────────────────────────

migrate:
	cd api && uv run alembic upgrade head

migrate-new:
	@read -p "Migration description: " desc; \
	cd api && uv run alembic revision --autogenerate -m "$$desc"

# ── Zitadel client setup ──────────────────────────────────────────────────────
# Run these after `make zitadel` to create the OIDC app and service account.
# Requires a Personal Access Token from the Zitadel console.

setup-web-client:
	@read -p "Zitadel PAT: " token; \
	bash api/scripts/create-web-client.sh -t "$$token"

setup-api-client:
	@read -p "Zitadel PAT: " token; \
	bash api/scripts/create-api-client.sh -t "$$token"

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean:
	docker compose down -v

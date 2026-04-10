# 1. Use the official slim image for a small, secure footprint
FROM python:3.12-slim

# 2. Build-time arguments for professional traceability
ARG GIT_COMMIT
ARG APP_VERSION
ENV DEBIAN_FRONTEND=noninteractive

# 3. Metadata Labels (Standard in production environments)
LABEL \
    vendor="Nerd Zero" \
    name="scrub" \
    summary="Scrub service" \
    org.opencontainers.image.description="Scrub service" \
    org.opencontainers.image.source="https://github.com" \
    maintainer="Nerd Zero <kuda@n0.rocks>" \
    vcs-ref="$GIT_COMMIT" \
    version="$APP_VERSION"

# 4. Install system dependencies and clean up in one layer
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 5. Set the working directory
WORKDIR /app

# 6. Install 'uv' and dependencies (Cached Layer)
# We copy only the lock files first to avoid re-installing on every code change
COPY pyproject.toml uv.lock /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir uv && \
    uv sync --frozen --no-dev

# 7. Copy the application source code
COPY . /app

# 8. Path Configuration
# This ensures 'scrub' is importable from the 'src' directory
ENV PYTHONPATH=/app/src
# Ensure Python output is sent straight to terminal (useful for Docker logs)
ENV PYTHONUNBUFFERED=1

EXPOSE 3000

# Point to the .venv folder created by 'uv sync'
CMD [".venv/bin/fastapi", "run", "src/main.py", "--port", "3000", "--host", "0.0.0.0"]

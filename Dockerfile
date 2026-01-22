FROM python:3.12-slim

ARG GIT_COMMIT
ARG APP_VERSION
ARG DEBIAN_FRONTEND=noninteractive



LABEL \
    vendor="Nerd Zero" \
    name="mail-validation-service" \
    summary="Mail validation service" \
    org.opencontainers.image.description="Mail validation service" \
    org.opencontainers.image.source="https://github.com/nerd-zero/mail-validation" \
    mantainer="Nerd Zero <kuda@n0.rocks>" \
    vcs-ref="$GIT_COMMIT" \
    version="$APP_VERSION"



# Install system deps (Cached)
RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*


# Install uv.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/


# Copy the application into the container.
COPY . /app

WORKDIR /app
RUN uv sync --frozen


CMD ["/app/.venv/bin/fastapi", "run", "/app/src/main.py", "--port", "80", "--host", "0.0.0.0"]


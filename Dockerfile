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

RUN apt-get update && apt-get install -y build-essential && rm -rf /var/lib/apt/lists/*


# Install dependencies with caching.
WORKDIR /app
COPY pyproject.toml uv.lock /app/
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir uv \
    && uv sync --frozen

# Copy the application into the container.
COPY . /app


CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "3000"]

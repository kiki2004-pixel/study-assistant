FROM docker.io/oven/bun:1-alpine AS base
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

# --- Dev target: bun dev server with hot-reload ---
FROM base AS dev
EXPOSE 80
CMD ["bun", "run", "dev", "--host", "0.0.0.0", "--port", "80"]

# --- Prod build ---
FROM base AS prod-build
ENV DOCKER_BUILD=1
ARG VITE_OIDC_AUTHORITY
ARG VITE_OIDC_CLIENT_ID
ARG VITE_OIDC_REDIRECT_URI
ARG VITE_OIDC_POST_LOGOUT_REDIRECT_URI
ENV VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY
ENV VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
ENV VITE_OIDC_REDIRECT_URI=$VITE_OIDC_REDIRECT_URI
ENV VITE_OIDC_POST_LOGOUT_REDIRECT_URI=$VITE_OIDC_POST_LOGOUT_REDIRECT_URI
RUN echo 'export * from "./server.node.js"' > node_modules/react-dom/server.bun.js && bun run build

# --- Prod runtime ---
FROM docker.io/nginx:alpine
COPY --from=prod-build /app/build/client /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

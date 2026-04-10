#!/bin/bash

# Script to create a Zitadel project and User Agent (SPA) application for the frontend.
# Uses Authorization Code + PKCE flow (no client secret needed).
# Outputs the generated client ID to set as VITE_OIDC_CLIENT_ID.

DEFAULT_ZITADEL_URL="http://localhost:8080"
DEFAULT_REDIRECT_URI="http://localhost:5173/auth/callback"
DEFAULT_POST_LOGOUT_URI="http://localhost:5173"
DEFAULT_PROJECT_NAME="scrub"
DEFAULT_APP_NAME="web"

usage() {
    echo "Usage: $0 -t <pat> [options]"
    echo ""
    echo "Required:"
    echo "  -t, --token           Zitadel Personal Access Token (from console → Service Users)"
    echo ""
    echo "Options:"
    echo "  -z, --zitadel-url     Zitadel base URL (default: ${DEFAULT_ZITADEL_URL})"
    echo "  -j, --project         Project name (default: ${DEFAULT_PROJECT_NAME})"
    echo "  -a, --app-name        Application name (default: ${DEFAULT_APP_NAME})"
    echo "  -r, --redirect-uri    Redirect URI (default: ${DEFAULT_REDIRECT_URI})"
    echo "  -l, --logout-uri      Post-logout redirect URI (default: ${DEFAULT_POST_LOGOUT_URI})"
    echo "  -h, --help            Show this help"
    exit 1
}

# --- Parse args ---
ZITADEL_URL="$DEFAULT_ZITADEL_URL"
PROJECT_NAME="$DEFAULT_PROJECT_NAME"
APP_NAME="$DEFAULT_APP_NAME"
REDIRECT_URI="$DEFAULT_REDIRECT_URI"
POST_LOGOUT_URI="$DEFAULT_POST_LOGOUT_URI"
PAT=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -t|--token) PAT="$2"; shift 2 ;;
        -z|--zitadel-url) ZITADEL_URL="$2"; shift 2 ;;
        -j|--project) PROJECT_NAME="$2"; shift 2 ;;
        -a|--app-name) APP_NAME="$2"; shift 2 ;;
        -r|--redirect-uri) REDIRECT_URI="$2"; shift 2 ;;
        -l|--logout-uri) POST_LOGOUT_URI="$2"; shift 2 ;;
        -h|--help) usage ;;
        *) echo "Unknown option: $1"; usage ;;
    esac
done

if [[ -z "$PAT" ]]; then
    echo "Error: --token is required."
    usage
fi

AUTH_HEADER="Authorization: Bearer ${PAT}"
MGMT_API="${ZITADEL_URL}/management/v1"

check_response() {
    local response="$1"
    local context="$2"
    if echo "$response" | grep -q '"code"'; then
        echo "Error in ${context}: ${response}"
        exit 1
    fi
}

echo "==> Creating project '${PROJECT_NAME}'..."
PROJECT_RESP=$(curl -s -X POST "${MGMT_API}/projects" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"${PROJECT_NAME}\"}")
check_response "$PROJECT_RESP" "create project"
PROJECT_ID=$(echo "$PROJECT_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "   Project ID: ${PROJECT_ID}"

echo "==> Creating User Agent application '${APP_NAME}'..."
APP_RESP=$(curl -s -X POST "${MGMT_API}/projects/${PROJECT_ID}/apps/oidc" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"${APP_NAME}\",
        \"redirectUris\": [\"${REDIRECT_URI}\"],
        \"responseTypes\": [\"OIDC_RESPONSE_TYPE_CODE\"],
        \"grantTypes\": [\"OIDC_GRANT_TYPE_AUTHORIZATION_CODE\"],
        \"appType\": \"OIDC_APP_TYPE_USER_AGENT\",
        \"authMethodType\": \"OIDC_AUTH_METHOD_TYPE_NONE\",
        \"postLogoutRedirectUris\": [\"${POST_LOGOUT_URI}\"],
        \"version\": \"OIDC_VERSION_1_0\",
        \"devMode\": true,
        \"accessTokenType\": \"OIDC_TOKEN_TYPE_BEARER\",
        \"accessTokenRoleAssertion\": false,
        \"idTokenRoleAssertion\": false,
        \"idTokenUserinfoAssertion\": false,
        \"additionalOrigins\": []
    }")
check_response "$APP_RESP" "create application"
CLIENT_ID=$(echo "$APP_RESP" | grep -o '"clientId":"[^"]*"' | cut -d'"' -f4)
echo "   Client ID: ${CLIENT_ID}"

echo ""
echo "==> Done. Set the following in web/.env:"
echo ""
echo "   VITE_OIDC_AUTHORITY=${ZITADEL_URL}"
echo "   VITE_OIDC_CLIENT_ID=${CLIENT_ID}"
echo "   VITE_OIDC_REDIRECT_URI=${REDIRECT_URI}"
echo "   VITE_OIDC_POST_LOGOUT_REDIRECT_URI=${POST_LOGOUT_URI}"

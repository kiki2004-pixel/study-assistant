#!/bin/bash

# Script to create a Zitadel Machine User (service account) for the API.
# Grants IAM Owner role so the machine user can manage users and org settings.
# Outputs a Personal Access Token for use in API_ZITADEL_PAT.

DEFAULT_ZITADEL_URL="http://localhost:8080"
DEFAULT_MACHINE_USER="api-service"

usage() {
    echo "Usage: $0 -t <pat> [options]"
    echo ""
    echo "Required:"
    echo "  -t, --token           Zitadel Personal Access Token (from console → Service Users)"
    echo ""
    echo "Options:"
    echo "  -z, --zitadel-url     Zitadel base URL (default: ${DEFAULT_ZITADEL_URL})"
    echo "  -u, --username        Machine user username (default: ${DEFAULT_MACHINE_USER})"
    echo "  -h, --help            Show this help"
    exit 1
}

# --- Parse args ---
ZITADEL_URL="$DEFAULT_ZITADEL_URL"
MACHINE_USER="$DEFAULT_MACHINE_USER"
PAT=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -t|--token) PAT="$2"; shift 2 ;;
        -z|--zitadel-url) ZITADEL_URL="$2"; shift 2 ;;
        -u|--username) MACHINE_USER="$2"; shift 2 ;;
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
AUTH_API="${ZITADEL_URL}/auth/v1"
ADMIN_API="${ZITADEL_URL}/admin/v1"

check_response() {
    local response="$1"
    local context="$2"
    if echo "$response" | grep -q '"code"'; then
        echo "Error in ${context}: ${response}"
        exit 1
    fi
}

echo "==> Creating machine user '${MACHINE_USER}'..."
USER_RESP=$(curl -s -X POST "${MGMT_API}/users/machine" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "{
        \"userName\": \"${MACHINE_USER}\",
        \"name\": \"API Service Account\",
        \"description\": \"Machine user for the Scrub API backend\",
        \"accessTokenType\": \"ACCESS_TOKEN_TYPE_BEARER\"
    }")
check_response "$USER_RESP" "create machine user"
USER_ID=$(echo "$USER_RESP" | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)
echo "   User ID: ${USER_ID}"

echo "==> Granting IAM_OWNER role to machine user..."
GRANT_RESP=$(curl -s -X POST "${ADMIN_API}/members" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "{
        \"userId\": \"${USER_ID}\",
        \"roles\": [\"IAM_OWNER\"]
    }")
check_response "$GRANT_RESP" "grant IAM_OWNER"

echo "==> Generating Personal Access Token for machine user..."
PAT_RESP=$(curl -s -X POST "${MGMT_API}/users/${USER_ID}/pats" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "{}")
check_response "$PAT_RESP" "create PAT"
MACHINE_PAT=$(echo "$PAT_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo ""
echo "==> Done. Store the following token securely — it will not be shown again:"
echo ""
echo "   API_ZITADEL_PAT=${MACHINE_PAT}"

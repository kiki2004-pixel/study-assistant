#!/bin/bash

# Script to create and configure a Keycloak PUBLIC client for the frontend SPA.
# Uses Authorization Code + PKCE flow (no client secret needed).
# All steps are idempotent - safe to run multiple times.

# --- Configuration: Default values ---
DEFAULT_KEYCLOAK_URL="https://auth.scrub.test"
DEFAULT_REDIRECT_URIS="https://scrub.test/auth/callback"
DEFAULT_POST_LOGOUT_REDIRECT_URIS="https://scrub.test"
DEFAULT_WEB_ORIGINS="https://scrub.test"

# --- Helper Functions ---
usage() {
    echo "Usage: $0 -u <admin_user> -p <admin_pass> -r <realm> -c <client_id> [options]"
    echo ""
    echo "Required Arguments:"
    echo "  -u, --admin-user      Keycloak admin username (from master realm)"
    echo "  -p, --admin-pass      Keycloak admin password"
    echo "  -r, --realm           Realm name where the client will be created (must exist)"
    echo "  -c, --client-id       Client ID for the new client"
    echo ""
    echo "Optional Arguments:"
    echo "  --keycloak-url URL    Base URL of Keycloak server. Default: ${DEFAULT_KEYCLOAK_URL}"
    echo "  --redirect-uris URIs  Comma-separated redirect URIs for the client."
    echo "                        Default: '${DEFAULT_REDIRECT_URIS}'"
    echo "  --post-logout-uris URIs  Comma-separated post-logout redirect URIs."
    echo "                           Default: '${DEFAULT_POST_LOGOUT_REDIRECT_URIS}'"
    echo "  --web-origins URIs    Comma-separated web origins for CORS."
    echo "                        Default: '${DEFAULT_WEB_ORIGINS}'"
    echo "  -h, --help            Show this help message"
    exit 1
}

check_deps() {
    for cmd in curl jq; do
        if ! command -v "$cmd" &> /dev/null; then
            echo "Error: Required command '$cmd' not found. Please install it and ensure it's in your PATH."
            exit 1
        fi
    done
}

# --- Argument Parsing ---
KEYCLOAK_URL="${DEFAULT_KEYCLOAK_URL}"
REDIRECT_URIS_PARAM="${DEFAULT_REDIRECT_URIS}"
POST_LOGOUT_REDIRECT_URIS_PARAM="${DEFAULT_POST_LOGOUT_REDIRECT_URIS}"
WEB_ORIGINS_PARAM="${DEFAULT_WEB_ORIGINS}"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin"
REALM_NAME="master"
CLIENT_ID="web"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -u|--admin-user) ADMIN_USERNAME="$2"; shift ;;
        -p|--admin-pass) ADMIN_PASSWORD="$2"; shift ;;
        -r|--realm) REALM_NAME="$2"; shift ;;
        -c|--client-id) CLIENT_ID="$2"; shift ;;
        --keycloak-url) KEYCLOAK_URL="$2"; shift ;;
        --redirect-uris) REDIRECT_URIS_PARAM="$2"; shift ;;
        --post-logout-uris) POST_LOGOUT_REDIRECT_URIS_PARAM="$2"; shift ;;
        --web-origins) WEB_ORIGINS_PARAM="$2"; shift ;;
        -h|--help) usage ;;
        *) echo "Unknown parameter passed: $1"; usage ;;
    esac
    shift
done

# Validate required arguments
if [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_PASSWORD" ] || [ -z "$REALM_NAME" ] || [ -z "$CLIENT_ID" ]; then
    echo "Error: Missing one or more required arguments."
    echo ""
    usage
fi

# --- Main Script Logic ---
check_deps

echo "-----------------------------------------------------"
echo " Keycloak Frontend Client Setup (Public / PKCE)"
echo "-----------------------------------------------------"
echo "Keycloak URL: ${KEYCLOAK_URL}"
echo "Admin User: ${ADMIN_USERNAME}"
echo "Target Realm: ${REALM_NAME}"
echo "Client ID: ${CLIENT_ID}"
echo "Redirect URIs: ${REDIRECT_URIS_PARAM}"
echo "Post-Logout URIs: ${POST_LOGOUT_REDIRECT_URIS_PARAM}"
echo "Web Origins: ${WEB_ORIGINS_PARAM}"
echo "-----------------------------------------------------"

# =========================================================
# Step 1: Get Admin Token
# =========================================================
echo "[1/9] Requesting admin access token from Keycloak (master realm)..."
TOKEN_RESPONSE=$(curl -s -X POST \
  "${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=${ADMIN_USERNAME}" \
  -d "password=${ADMIN_PASSWORD}" \
  -d "grant_type=password" \
  -d "client_id=admin-cli")

ADMIN_TOKEN=$(echo "${TOKEN_RESPONSE}" | jq -r .access_token)

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo "ERROR: Failed to retrieve admin token."
    echo "Response from Keycloak:"
    echo "${TOKEN_RESPONSE}" | jq .
    exit 1
fi
echo "SUCCESS: Admin token obtained."
echo "-----------------------------------------------------"

# =========================================================
# Step 2: Prepare URI arrays
# =========================================================
echo "[2/9] Preparing URI arrays..."

# Redirect URIs
IFS=',' read -r -a redirect_array <<< "$REDIRECT_URIS_PARAM"
if [ ${#redirect_array[@]} -eq 0 ] || ([ ${#redirect_array[@]} -eq 1 ] && [ -z "${redirect_array[0]}" ]); then
    REDIRECT_URIS_JSON="[]"
else
    REDIRECT_URIS_JSON=$(printf '%s\n' "${redirect_array[@]}" | jq -R . | jq -s .)
fi

# Post-logout redirect URIs (stored in attributes, not top-level)
IFS=',' read -r -a post_logout_array <<< "$POST_LOGOUT_REDIRECT_URIS_PARAM"
if [ ${#post_logout_array[@]} -eq 0 ] || ([ ${#post_logout_array[@]} -eq 1 ] && [ -z "${post_logout_array[0]}" ]); then
    POST_LOGOUT_URIS_ATTR="+"
else
    # Join with ## separator as expected by Keycloak attributes
    POST_LOGOUT_URIS_ATTR=$(IFS='##'; echo "${post_logout_array[*]}")
fi

# Web origins
IFS=',' read -r -a origins_array <<< "$WEB_ORIGINS_PARAM"
if [ ${#origins_array[@]} -eq 0 ] || ([ ${#origins_array[@]} -eq 1 ] && [ -z "${origins_array[0]}" ]); then
    WEB_ORIGINS_JSON="[\"+\"]"
else
    WEB_ORIGINS_JSON=$(printf '%s\n' "${origins_array[@]}" | jq -R . | jq -s .)
fi

echo "Redirect URIs: ${REDIRECT_URIS_JSON}"
echo "Post-Logout URIs: ${POST_LOGOUT_URIS_ATTR}"
echo "Web Origins: ${WEB_ORIGINS_JSON}"
echo "-----------------------------------------------------"

# =========================================================
# Step 3: Construct Client Payload (Public client with PKCE)
# =========================================================
echo "[3/9] Constructing public client JSON payload..."
CLIENT_PAYLOAD=$(jq -n \
  --arg cid "$CLIENT_ID" \
  --argjson enabled true \
  --argjson standardFlowEnabled true \
  --argjson implicitFlowEnabled false \
  --argjson directAccessGrantsEnabled false \
  --argjson serviceAccountsEnabled false \
  --argjson publicClient true \
  --argjson bearerOnly false \
  --arg protocol "openid-connect" \
  --argjson fullScopeAllowed true \
  --argjson redirectUris "$REDIRECT_URIS_JSON" \
  --argjson webOrigins "$WEB_ORIGINS_JSON" \
  --argjson defaultClientScopes '["web-origins", "profile", "email", "roles", "groups"]' \
  --argjson optionalClientScopes '["address", "phone", "offline_access", "agent"]' \
  --arg postLogoutUris "$POST_LOGOUT_URIS_ATTR" \
'{
  clientId: $cid,
  enabled: $enabled,
  standardFlowEnabled: $standardFlowEnabled,
  implicitFlowEnabled: $implicitFlowEnabled,
  directAccessGrantsEnabled: $directAccessGrantsEnabled,
  serviceAccountsEnabled: $serviceAccountsEnabled,
  publicClient: $publicClient,
  bearerOnly: $bearerOnly,
  protocol: $protocol,
  fullScopeAllowed: $fullScopeAllowed,
  redirectUris: $redirectUris,
  webOrigins: $webOrigins,
  defaultClientScopes: $defaultClientScopes,
  optionalClientScopes: $optionalClientScopes,
  attributes: {
    "pkce.code.challenge.method": "S256",
    "backchannel.logout.session.required": "true",
    "display.on.consent.screen": "true",
    "oauth2.device.authorization.grant.enabled": "false",
    "post.logout.redirect.uris": $postLogoutUris
  },
  consentRequired: false
}')
echo "-----------------------------------------------------"

# =========================================================
# Step 4: Create Client (idempotent - 409 = already exists)
# =========================================================
echo "[4/9] Creating public client '${CLIENT_ID}' in realm '${REALM_NAME}'..."
RESPONSE_BODY_FILE=$(mktemp)
HTTP_STATUS_CODE=$(curl -s -w "%{http_code}" -o "${RESPONSE_BODY_FILE}" -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${CLIENT_PAYLOAD}")

RESPONSE_BODY=$(cat "${RESPONSE_BODY_FILE}")
rm -f "${RESPONSE_BODY_FILE}"

if [ "$HTTP_STATUS_CODE" == "201" ]; then
    echo "SUCCESS: Public client '${CLIENT_ID}' created."
elif [ "$HTTP_STATUS_CODE" == "409" ]; then
    echo "EXISTS: Client '${CLIENT_ID}' already exists. Updating configuration..."
    CLIENT_UUID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')
    if [ -n "$CLIENT_UUID" ] && [ "$CLIENT_UUID" != "null" ]; then
        UPDATE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
          "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}" \
          -H "Authorization: Bearer ${ADMIN_TOKEN}" \
          -H "Content-Type: application/json" \
          -d "${CLIENT_PAYLOAD}")
        if [ "$UPDATE_STATUS" == "204" ]; then
            echo "SUCCESS: Client '${CLIENT_ID}' updated."
        else
            echo "WARNING: Failed to update client '${CLIENT_ID}'. HTTP Status: ${UPDATE_STATUS}."
        fi
    else
        echo "WARNING: Could not find client UUID for '${CLIENT_ID}' to update."
    fi
elif [ "$HTTP_STATUS_CODE" == "401" ]; then
    echo "ERROR: Unauthorized. Check admin credentials or token validity."
    exit 1
elif [ "$HTTP_STATUS_CODE" == "403" ]; then
    echo "ERROR: Forbidden. Admin user may not have permissions to create clients in realm '${REALM_NAME}'."
    exit 1
elif [ "$HTTP_STATUS_CODE" == "404" ]; then
    echo "ERROR: Realm '${REALM_NAME}' not found or Keycloak URL path is incorrect."
    exit 1
else
    echo "ERROR: Failed to create client '${CLIENT_ID}'. HTTP Status: ${HTTP_STATUS_CODE}."
    if [ -n "$RESPONSE_BODY" ]; then
        echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
    fi
    exit 1
fi

# =========================================================
# Step 5: Create 'openid' client scope (idempotent)
# =========================================================
echo "[5/9] Creating 'openid' client scope..."
SCOPE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/client-scopes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "openid",
    "protocol": "openid-connect",
    "attributes": {
      "include.in.token.scope": "true",
      "display.on.consent.screen": "false"
    }
  }')

if [ "$SCOPE_STATUS" == "201" ]; then
    echo "SUCCESS: 'openid' client scope created."
elif [ "$SCOPE_STATUS" == "409" ]; then
    echo "SKIPPED: 'openid' client scope already exists."
else
    echo "WARNING: Failed to create 'openid' client scope. HTTP Status: ${SCOPE_STATUS}."
fi
echo "-----------------------------------------------------"

# =========================================================
# Step 6: Assign 'openid' scope to client
# =========================================================
echo "[6/9] Assigning 'openid' scope to client '${CLIENT_ID}'..."
OPENID_SCOPE_ID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/client-scopes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[] | select(.name=="openid") | .id')

if [ -n "$OPENID_SCOPE_ID" ] && [ "$OPENID_SCOPE_ID" != "null" ]; then
    CLIENT_UUID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')

    if [ -n "$CLIENT_UUID" ] && [ "$CLIENT_UUID" != "null" ]; then
        ASSIGN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
          "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/default-client-scopes/${OPENID_SCOPE_ID}" \
          -H "Authorization: Bearer ${ADMIN_TOKEN}")
        if [ "$ASSIGN_STATUS" == "204" ]; then
            echo "SUCCESS: 'openid' scope assigned to '${CLIENT_ID}'."
        else
            echo "WARNING: Failed to assign 'openid' scope. HTTP Status: ${ASSIGN_STATUS}."
        fi
    else
        echo "WARNING: Could not find client '${CLIENT_ID}' to assign scope."
    fi
else
    echo "WARNING: Could not find 'openid' client scope to assign."
fi
echo "-----------------------------------------------------"

# =========================================================
# Step 7: Set access token lifespan to 30 minutes
# =========================================================
echo "[7/9] Setting access token lifespan to 30 minutes..."
REALM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"accessTokenLifespan": 1800}')

if [ "$REALM_STATUS" == "204" ]; then
    echo "SUCCESS: Access token lifespan set to 1800s (30 minutes)."
else
    echo "WARNING: Failed to update token lifespan. HTTP Status: ${REALM_STATUS}."
fi

# =========================================================
# Step 8: Add audience mapper so web tokens include 'api' in aud
# (required for token exchange - the API client must be in the token audience)
# =========================================================
echo "[8/9] Adding 'api' audience mapper to client '${CLIENT_ID}'..."

CLIENT_UUID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')

if [ -n "$CLIENT_UUID" ] && [ "$CLIENT_UUID" != "null" ]; then
    # Check if mapper already exists
    EXISTING_MAPPER=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/protocol-mappers/models" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[] | select(.name=="api-audience") | .id')

    MAPPER_PAYLOAD='{
        "name": "api-audience",
        "protocol": "openid-connect",
        "protocolMapper": "oidc-audience-mapper",
        "consentRequired": false,
        "config": {
          "included.client.audience": "api",
          "id.token.claim": "false",
          "lightweight.claim": "false",
          "access.token.claim": "true",
          "introspection.token.claim": "true"
        }
      }'

    if [ -n "$EXISTING_MAPPER" ] && [ "$EXISTING_MAPPER" != "null" ]; then
        # Update existing mapper to ensure correct configuration
        UPDATE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
          "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/protocol-mappers/models/${EXISTING_MAPPER}" \
          -H "Authorization: Bearer ${ADMIN_TOKEN}" \
          -H "Content-Type: application/json" \
          -d "$(echo "$MAPPER_PAYLOAD" | jq --arg id "$EXISTING_MAPPER" '. + {id: $id}')")

        if [ "$UPDATE_STATUS" == "204" ]; then
            echo "SUCCESS: 'api-audience' mapper updated on '${CLIENT_ID}'."
        else
            echo "WARNING: Failed to update audience mapper. HTTP Status: ${UPDATE_STATUS}."
        fi
    else
        MAPPER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
          "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/protocol-mappers/models" \
          -H "Authorization: Bearer ${ADMIN_TOKEN}" \
          -H "Content-Type: application/json" \
          -d "$MAPPER_PAYLOAD")

        if [ "$MAPPER_STATUS" == "201" ]; then
            echo "SUCCESS: 'api-audience' mapper added to '${CLIENT_ID}'."
        else
            echo "WARNING: Failed to add audience mapper. HTTP Status: ${MAPPER_STATUS}."
        fi
    fi
else
    echo "WARNING: Could not find client '${CLIENT_ID}' to add audience mapper."
fi
echo "-----------------------------------------------------"

# =========================================================
# Step 9: Assign 'agent' scope as optional scope to web client
# (required for token exchange to include 'act' claim)
# =========================================================
echo "[9/9] Assigning 'agent' scope as optional scope to client '${CLIENT_ID}'..."

AGENT_SCOPE_ID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/client-scopes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[] | select(.name=="agent") | .id')

if [ -n "$AGENT_SCOPE_ID" ] && [ "$AGENT_SCOPE_ID" != "null" ]; then
    # Re-fetch CLIENT_UUID if not set
    if [ -z "$CLIENT_UUID" ] || [ "$CLIENT_UUID" == "null" ]; then
        CLIENT_UUID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}" \
          -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')
    fi

    if [ -n "$CLIENT_UUID" ] && [ "$CLIENT_UUID" != "null" ]; then
        AGENT_ASSIGN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
          "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${CLIENT_UUID}/optional-client-scopes/${AGENT_SCOPE_ID}" \
          -H "Authorization: Bearer ${ADMIN_TOKEN}")
        if [ "$AGENT_ASSIGN_STATUS" == "204" ]; then
            echo "SUCCESS: 'agent' scope assigned as optional scope to '${CLIENT_ID}'."
        else
            echo "WARNING: Failed to assign 'agent' scope. HTTP Status: ${AGENT_ASSIGN_STATUS}."
        fi
    else
        echo "WARNING: Could not find client '${CLIENT_ID}' to assign 'agent' scope."
    fi
else
    echo "WARNING: Could not find 'agent' client scope. Ensure create-api-client.sh has been run first."
fi
echo "-----------------------------------------------------"

echo "-----------------------------------------------------"
echo "Done. Frontend public client '${CLIENT_ID}' is ready."
echo ""
echo "Use these environment variables in your frontend .env:"
echo "  NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=${CLIENT_ID}"
echo "  NEXT_PUBLIC_KEYCLOAK_ISSUER=${KEYCLOAK_URL}/realms/${REALM_NAME}"
echo "-----------------------------------------------------"
exit 0

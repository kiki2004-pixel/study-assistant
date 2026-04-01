#!/bin/bash

# Script to create and configure a Keycloak client using the Admin REST API.
# All steps are idempotent - safe to run multiple times.

# --- Configuration: Default values ---
DEFAULT_KEYCLOAK_URL="http://localhost:8080"
DEFAULT_REDIRECT_URIS="http://localhost:3000/*"

# --- Helper Functions ---
usage() {
    echo "Usage: $0 -u <admin_user> -p <admin_pass> -r <realm> -c <client_id> -s <client_secret> [options]"
    echo ""
    echo "Required Arguments:"
    echo "  -u, --admin-user      Keycloak admin username (from master realm)"
    echo "  -p, --admin-pass      Keycloak admin password"
    echo "  -r, --realm           Realm name where the client will be created (must exist)"
    echo "  -c, --client-id       Client ID for the new client"
    echo "  -s, --client-secret   Client Secret for the new client"
    echo ""
    echo "Optional Arguments:"
    echo "  --keycloak-url URL    Base URL of Keycloak server. Default: ${DEFAULT_KEYCLOAK_URL}"
    echo "  --redirect-uris URIs  Comma-separated redirect URIs for the client."
    echo "                        Default: '${DEFAULT_REDIRECT_URIS}'"
    echo "                        Example: 'http://app1/cb,http://app2/cb'"
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
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin"
REALM_NAME="master"
CLIENT_ID="api"
CLIENT_SECRET="secret"

while [[ "$#" -gt 0 ]]; do
    case $1 in
        -u|--admin-user) ADMIN_USERNAME="$2"; shift ;;
        -p|--admin-pass) ADMIN_PASSWORD="$2"; shift ;;
        -r|--realm) REALM_NAME="$2"; shift ;;
        -c|--client-id) CLIENT_ID="$2"; shift ;;
        -s|--client-secret) CLIENT_SECRET="$2"; shift ;;
        --keycloak-url) KEYCLOAK_URL="$2"; shift ;;
        --redirect-uris) REDIRECT_URIS_PARAM="$2"; shift ;;
        -h|--help) usage ;;
        *) echo "Unknown parameter passed: $1"; usage ;;
    esac
    shift
done

# Validate required arguments
if [ -z "$ADMIN_USERNAME" ] || [ -z "$ADMIN_PASSWORD" ] || [ -z "$REALM_NAME" ] || [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
    echo "Error: Missing one or more required arguments."
    echo ""
    usage
fi

# --- Main Script Logic ---
check_deps

echo "-----------------------------------------------------"
echo " Keycloak Client Setup Script (Idempotent)"
echo "-----------------------------------------------------"
echo "Keycloak URL: ${KEYCLOAK_URL}"
echo "Admin User: ${ADMIN_USERNAME}"
echo "Target Realm: ${REALM_NAME}"
echo "Client ID: ${CLIENT_ID}"
echo "Redirect URIs: ${REDIRECT_URIS_PARAM}"
echo "-----------------------------------------------------"

# =========================================================
# Step 1: Get Admin Token
# =========================================================
echo "[1/10] Requesting admin access token from Keycloak (master realm)..."
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
# Step 2: Prepare Redirect URIs
# =========================================================
echo "[2/10] Preparing redirect URIs..."
IFS=',' read -r -a uris_array <<< "$REDIRECT_URIS_PARAM"
if [ ${#uris_array[@]} -eq 0 ] || ([ ${#uris_array[@]} -eq 1 ] && [ -z "${uris_array[0]}" ]); then
    REDIRECT_URIS_JSON_ARRAY="[]"
    echo "WARNING: No redirect URIs provided or parsed."
else
    REDIRECT_URIS_JSON_ARRAY=$(printf '%s\n' "${uris_array[@]}" | jq -R . | jq -s .)
fi
echo "Redirect URIs JSON: ${REDIRECT_URIS_JSON_ARRAY}"
echo "-----------------------------------------------------"

# =========================================================
# Step 3: Construct Client Payload
# =========================================================
echo "[3/10] Constructing client JSON payload..."
CLIENT_PAYLOAD=$(jq -n \
  --arg cid "$CLIENT_ID" \
  --arg secret "$CLIENT_SECRET" \
  --argjson enabled true \
  --argjson standardFlowEnabled true \
  --argjson implicitFlowEnabled false \
  --argjson directAccessGrantsEnabled true \
  --argjson serviceAccountsEnabled true \
  --argjson publicClient false \
  --argjson bearerOnly false \
  --arg clientAuthType "client-secret" \
  --argjson authorizationServicesEnabled true \
  --arg protocol "openid-connect" \
  --argjson fullScopeAllowed true \
  --argjson redirectUris "$REDIRECT_URIS_JSON_ARRAY" \
  --argjson defaultClientScopes '["web-origins", "profile", "email", "roles"]' \
  --argjson optionalClientScopes '["address", "phone", "offline_access", "microprofile-jwt"]' \
  --argjson attributes '{
    "backchannel.logout.session.required": "true",
    "backchannel.logout.revoke.offline.tokens": "true",
    "display.on.consent.screen": "true",
    "oauth2.device.authorization.grant.enabled": "false",
    "standard.token.exchange.enabled": "true"
  }' \
'{
  clientId: $cid,
  secret: $secret,
  enabled: $enabled,
  standardFlowEnabled: $standardFlowEnabled,
  implicitFlowEnabled: $implicitFlowEnabled,
  directAccessGrantsEnabled: $directAccessGrantsEnabled,
  serviceAccountsEnabled: $serviceAccountsEnabled,
  publicClient: $publicClient,
  bearerOnly: $bearerOnly,
  clientAuthenticatorType: $clientAuthType,
  authorizationServicesEnabled: $authorizationServicesEnabled,
  protocol: $protocol,
  fullScopeAllowed: $fullScopeAllowed,
  redirectUris: $redirectUris,
  defaultClientScopes: $defaultClientScopes,
  optionalClientScopes: $optionalClientScopes,
  attributes: $attributes,
  consentRequired: false
}')
echo "-----------------------------------------------------"

# =========================================================
# Step 4: Create Client (idempotent - 409 = already exists)
# =========================================================
echo "[4/10] Creating client '${CLIENT_ID}' in realm '${REALM_NAME}'..."
RESPONSE_BODY_FILE=$(mktemp)
HTTP_STATUS_CODE=$(curl -s -w "%{http_code}" -o "${RESPONSE_BODY_FILE}" -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${CLIENT_PAYLOAD}")

RESPONSE_BODY=$(cat "${RESPONSE_BODY_FILE}")
rm -f "${RESPONSE_BODY_FILE}"

if [ "$HTTP_STATUS_CODE" == "201" ]; then
    echo "SUCCESS: Client '${CLIENT_ID}' created."
elif [ "$HTTP_STATUS_CODE" == "409" ]; then
    echo "EXISTS: Client '${CLIENT_ID}' already exists. Updating configuration..."
    EXISTING_UUID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')
    if [ -n "$EXISTING_UUID" ] && [ "$EXISTING_UUID" != "null" ]; then
        UPDATE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
          "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${EXISTING_UUID}" \
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

# ---------------------------------------------------------
# Resolve shared IDs needed by steps 5-8
# ---------------------------------------------------------
INTERNAL_CLIENT_ID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${CLIENT_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')

if [ -z "$INTERNAL_CLIENT_ID" ] || [ "$INTERNAL_CLIENT_ID" == "null" ]; then
    echo "ERROR: Could not resolve internal ID for client '${CLIENT_ID}'. Cannot continue."
    exit 1
fi
echo "-----------------------------------------------------"

# =========================================================
# Step 5: Enable standard token exchange on client
# (idempotent - only updates if not already enabled)
# =========================================================
echo "[5/10] Enabling standard token exchange on client '${CLIENT_ID}'..."

CURRENT_CLIENT=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${INTERNAL_CLIENT_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

TOKEN_EXCHANGE_ENABLED=$(echo "$CURRENT_CLIENT" | jq -r '.attributes["standard.token.exchange.enabled"] // "false"')

if [ "$TOKEN_EXCHANGE_ENABLED" != "true" ]; then
    UPDATED_CLIENT=$(echo "$CURRENT_CLIENT" | jq '.attributes["standard.token.exchange.enabled"] = "true"')

    UPDATE_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X PUT \
      "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${INTERNAL_CLIENT_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "${UPDATED_CLIENT}")

    if [ "$UPDATE_STATUS" == "204" ]; then
        echo "SUCCESS: Standard token exchange enabled on client '${CLIENT_ID}'."
    else
        echo "WARNING: Failed to enable standard token exchange. HTTP Status: ${UPDATE_STATUS}."
    fi
else
    echo "SKIPPED: Standard token exchange already enabled."
fi
echo "-----------------------------------------------------"

# =========================================================
# Step 6: Create 'Admin' group and assign admin user
# (idempotent - 409 = group exists, PUT group membership is idempotent)
# =========================================================
echo "[6/10] Creating 'Admin' group..."

ADMIN_GROUP_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/groups" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Admin"}')

if [ "$ADMIN_GROUP_STATUS" == "201" ]; then
    echo "SUCCESS: 'Admin' group created."
elif [ "$ADMIN_GROUP_STATUS" == "409" ]; then
    echo "SKIPPED: 'Admin' group already exists."
else
    echo "WARNING: Failed to create 'Admin' group. HTTP Status: ${ADMIN_GROUP_STATUS}."
fi

ADMIN_GROUP_ID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/groups?search=Admin&exact=true" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')

ADMIN_USER_ID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users?username=${ADMIN_USERNAME}&exact=true" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')

if [ -n "$ADMIN_GROUP_ID" ] && [ "$ADMIN_GROUP_ID" != "null" ] && \
   [ -n "$ADMIN_USER_ID" ] && [ "$ADMIN_USER_ID" != "null" ]; then
    ASSIGN_GROUP_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X PUT \
      "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${ADMIN_USER_ID}/groups/${ADMIN_GROUP_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}")

    if [ "$ASSIGN_GROUP_STATUS" == "204" ]; then
        echo "SUCCESS: User '${ADMIN_USERNAME}' assigned to 'Admin' group."
    else
        echo "WARNING: Failed to assign user to 'Admin' group. HTTP Status: ${ASSIGN_GROUP_STATUS}."
    fi
else
    echo "WARNING: Could not find Admin group or admin user to assign group membership."
fi
echo "-----------------------------------------------------"

# =========================================================
# Step 7: Create 'groups' client scope and assign to client
# (idempotent - 409 = scope exists, PUT scope assignment is idempotent)
# =========================================================
echo "[7/10] Creating 'groups' client scope..."

GROUPS_SCOPE_PAYLOAD=$(jq -n '{
  name: "groups",
  description: "Group membership",
  protocol: "openid-connect",
  attributes: {
    "include.in.token.scope": "true",
    "display.on.consent.screen": "true"
  },
  protocolMappers: [{
    name: "groups",
    protocol: "openid-connect",
    protocolMapper: "oidc-group-membership-mapper",
    consentRequired: false,
    config: {
      "full.path": "false",
      "introspection.token.claim": "true",
      "userinfo.token.claim": "true",
      "id.token.claim": "true",
      "access.token.claim": "true",
      "claim.name": "groups"
    }
  }]
}')

GROUPS_HTTP_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/client-scopes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${GROUPS_SCOPE_PAYLOAD}")

if [ "$GROUPS_HTTP_STATUS" == "201" ]; then
    echo "SUCCESS: 'groups' client scope created."
elif [ "$GROUPS_HTTP_STATUS" == "409" ]; then
    echo "SKIPPED: 'groups' client scope already exists."
else
    echo "WARNING: Failed to create 'groups' client scope. HTTP Status: ${GROUPS_HTTP_STATUS}."
fi

GROUPS_SCOPE_ID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/client-scopes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[] | select(.name=="groups") | .id')

if [ -n "$GROUPS_SCOPE_ID" ] && [ "$GROUPS_SCOPE_ID" != "null" ]; then
    ASSIGN_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X PUT \
      "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${INTERNAL_CLIENT_ID}/default-client-scopes/${GROUPS_SCOPE_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}")

    if [ "$ASSIGN_STATUS" == "204" ]; then
        echo "SUCCESS: 'groups' scope assigned to client '${CLIENT_ID}'."
    else
        echo "WARNING: Failed to assign 'groups' scope to client. HTTP Status: ${ASSIGN_STATUS}."
    fi
else
    echo "WARNING: Could not find 'groups' scope to assign to client."
fi
echo "-----------------------------------------------------"

# ---------------------------------------------------------
# Resolve service account and realm management client IDs
# needed by steps 7-8
# ---------------------------------------------------------
SERVICE_ACCOUNT_USER_ID=$(curl -s \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${INTERNAL_CLIENT_ID}/service-account-user" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.id')

if [ -z "$SERVICE_ACCOUNT_USER_ID" ] || [ "$SERVICE_ACCOUNT_USER_ID" == "null" ]; then
    echo "WARNING: Could not find service account user for client '${CLIENT_ID}'."
    echo "         Steps 7-8 (service account role assignments) will be skipped."
    echo "         Ensure 'serviceAccountsEnabled' is true for this client."
    echo "-----------------------------------------------------"
    exit 0
fi

# In non-master realms it's 'realm-management', in master realm it's '{realm}-realm'
REALM_MGMT_CLIENT_ID=$(curl -s \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=realm-management" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')

if [ -z "$REALM_MGMT_CLIENT_ID" ] || [ "$REALM_MGMT_CLIENT_ID" == "null" ]; then
    REALM_MGMT_CLIENT_ID=$(curl -s \
      "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients?clientId=${REALM_NAME}-realm" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[0].id')
fi

if [ -z "$REALM_MGMT_CLIENT_ID" ] || [ "$REALM_MGMT_CLIENT_ID" == "null" ]; then
    echo "WARNING: Could not find realm management client ('realm-management' or '${REALM_NAME}-realm')."
    echo "         Steps 7-8 (service account role assignments) will be skipped."
    echo "-----------------------------------------------------"
    exit 0
fi

# =========================================================
# Step 8: Assign 'manage-users' role to service account
# (idempotent - POST role mapping returns 204 if already assigned)
# =========================================================
echo "[8/10] Assigning 'manage-users' role to service account..."

MANAGE_USERS_ROLE=$(curl -s \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${REALM_MGMT_CLIENT_ID}/roles/manage-users" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")
MANAGE_USERS_ROLE_ID=$(echo "$MANAGE_USERS_ROLE" | jq -r '.id')

if [ -n "$MANAGE_USERS_ROLE_ID" ] && [ "$MANAGE_USERS_ROLE_ID" != "null" ]; then
    ASSIGN_ROLE_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
      "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${SERVICE_ACCOUNT_USER_ID}/role-mappings/clients/${REALM_MGMT_CLIENT_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "[$(echo "$MANAGE_USERS_ROLE" | jq -c .)]")

    if [ "$ASSIGN_ROLE_STATUS" == "204" ]; then
        echo "SUCCESS: 'manage-users' role assigned to service account of '${CLIENT_ID}'."
    else
        echo "WARNING: Failed to assign 'manage-users' role. HTTP Status: ${ASSIGN_ROLE_STATUS}."
    fi
else
    echo "WARNING: Could not find 'manage-users' role."
fi
echo "-----------------------------------------------------"

# =========================================================
# Step 9: Assign 'manage-realm' role to service account
# (idempotent - POST role mapping returns 204 if already assigned)
# =========================================================
echo "[9/10] Assigning 'manage-realm' role to service account..."

MANAGE_REALM_ROLE=$(curl -s \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${REALM_MGMT_CLIENT_ID}/roles/manage-realm" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")
MANAGE_REALM_ROLE_ID=$(echo "$MANAGE_REALM_ROLE" | jq -r '.id')

if [ -n "$MANAGE_REALM_ROLE_ID" ] && [ "$MANAGE_REALM_ROLE_ID" != "null" ]; then
    ASSIGN_REALM_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
      "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/users/${SERVICE_ACCOUNT_USER_ID}/role-mappings/clients/${REALM_MGMT_CLIENT_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "[$(echo "$MANAGE_REALM_ROLE" | jq -c .)]")

    if [ "$ASSIGN_REALM_STATUS" == "204" ]; then
        echo "SUCCESS: 'manage-realm' role assigned to service account of '${CLIENT_ID}'."
    else
        echo "WARNING: Failed to assign 'manage-realm' role. HTTP Status: ${ASSIGN_REALM_STATUS}."
    fi
else
    echo "WARNING: Could not find 'manage-realm' role."
fi

echo "-----------------------------------------------------"

# =========================================================
# Step 10: Create 'agent' client scope with 'act' claim mapper
# and assign as optional scope on client
# (idempotent - 409 = scope exists, PUT scope assignment is idempotent)
# =========================================================
echo "[10/10] Creating 'agent' client scope with 'act' claim mapper..."

AGENT_SCOPE_PAYLOAD=$(jq -n '{
  name: "agent",
  description: "Agent token scope - adds act claim for token exchange identification",
  protocol: "openid-connect",
  attributes: {
    "include.in.token.scope": "true",
    "display.on.consent.screen": "false"
  },
  protocolMappers: [{
    name: "act-claim",
    protocol: "openid-connect",
    protocolMapper: "oidc-hardcoded-claim-mapper",
    consentRequired: false,
    config: {
      "claim.name": "act",
      "claim.value": "{\"sub\": \"app\"}",
      "jsonType.label": "JSON",
      "id.token.claim": "false",
      "access.token.claim": "true",
      "lightweight.claim": "false",
      "userinfo.token.claim": "false",
      "access.tokenResponse.claim": "false",
      "introspection.token.claim": "true"
    }
  }]
}')

AGENT_SCOPE_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
  "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/client-scopes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "${AGENT_SCOPE_PAYLOAD}")

if [ "$AGENT_SCOPE_STATUS" == "201" ]; then
    echo "SUCCESS: 'agent' client scope created."
elif [ "$AGENT_SCOPE_STATUS" == "409" ]; then
    echo "SKIPPED: 'agent' client scope already exists."
else
    echo "WARNING: Failed to create 'agent' client scope. HTTP Status: ${AGENT_SCOPE_STATUS}."
fi

# Assign as optional scope on the client
AGENT_SCOPE_ID=$(curl -s "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/client-scopes" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq -r '.[] | select(.name=="agent") | .id')

if [ -n "$AGENT_SCOPE_ID" ] && [ "$AGENT_SCOPE_ID" != "null" ]; then
    ASSIGN_AGENT_STATUS=$(curl -s -w "%{http_code}" -o /dev/null -X PUT \
      "${KEYCLOAK_URL}/admin/realms/${REALM_NAME}/clients/${INTERNAL_CLIENT_ID}/optional-client-scopes/${AGENT_SCOPE_ID}" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}")

    if [ "$ASSIGN_AGENT_STATUS" == "204" ]; then
        echo "SUCCESS: 'agent' scope assigned as optional scope to client '${CLIENT_ID}'."
    else
        echo "WARNING: Failed to assign 'agent' scope to client. HTTP Status: ${ASSIGN_AGENT_STATUS}."
    fi
else
    echo "WARNING: Could not find 'agent' scope to assign to client."
fi
echo "-----------------------------------------------------"

echo "-----------------------------------------------------"
echo "Done."
exit 0

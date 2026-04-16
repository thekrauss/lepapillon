#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# LePapillon — Create/update a test user in Keycloak
# ============================================================================

KEYCLOAK_BASE_URL="${KEYCLOAK_BASE_URL:-http://localhost:8180}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-lepapillon}"
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"

TEST_EMAIL="${TEST_EMAIL:-cheffe@saveursthai.fr}"
TEST_PASSWORD="${TEST_PASSWORD:-Test1234!}"
TEST_FIRST_NAME="${TEST_FIRST_NAME:-Cheffe}"
TEST_LAST_NAME="${TEST_LAST_NAME:-Thai}"
TEST_ROLE="${TEST_ROLE:-admin}"
API_CLIENT_ID="${API_CLIENT_ID:-lepapillon-api}"

fail() { echo "ERROR: $*" >&2; exit 1; }
log()  { echo "==> $*" >&2; }

# Get admin token
ADMIN_TOKEN="$(
  curl -fsS -X POST "${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password&client_id=admin-cli&username=${KEYCLOAK_ADMIN_USER}&password=${KEYCLOAK_ADMIN_PASSWORD}" \
  | jq -r '.access_token'
)"
[ -n "$ADMIN_TOKEN" ] || fail "could not get admin token"

# Check if user exists
EXISTING="$(
  curl -fsS -X GET \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    "${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users?email=${TEST_EMAIL}&exact=true" \
  | jq -r '.[0].id // empty'
)"

if [ -n "$EXISTING" ]; then
  log "User ${TEST_EMAIL} already exists (${EXISTING}), updating password..."
  # Reset password
  curl -fsS -X PUT \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"password\",\"value\":\"${TEST_PASSWORD}\",\"temporary\":false}" \
    "${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users/${EXISTING}/reset-password" >/dev/null
  USER_ID="$EXISTING"
else
  log "Creating user ${TEST_EMAIL}..."
  curl -fsS -X POST \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg email "$TEST_EMAIL" \
      --arg fn "$TEST_FIRST_NAME" \
      --arg ln "$TEST_LAST_NAME" \
      --arg pw "$TEST_PASSWORD" \
      '{
        username: $email,
        email: $email,
        firstName: $fn,
        lastName: $ln,
        emailVerified: true,
        enabled: true,
        credentials: [{type: "password", value: $pw, temporary: false}]
      }'
    )" \
    "${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users" >/dev/null

  USER_ID="$(
    curl -fsS -X GET \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      "${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users?email=${TEST_EMAIL}&exact=true" \
    | jq -r '.[0].id'
  )"
fi

[ -n "$USER_ID" ] || fail "could not resolve user ID"

# Assign client role
CLIENT_UUID="$(
  curl -fsS -X GET \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    "${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/clients?clientId=${API_CLIENT_ID}" \
  | jq -r --arg cid "$API_CLIENT_ID" '.[] | select(.clientId == $cid) | .id'
)"

if [ -n "$CLIENT_UUID" ]; then
  ROLE_JSON="$(
    curl -fsS -X GET \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      "${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/clients/${CLIENT_UUID}/roles/${TEST_ROLE}" 2>/dev/null || true
  )"
  if [ -n "$ROLE_JSON" ]; then
    log "Assigning role '${TEST_ROLE}' to user..."
    curl -fsS -X POST \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "[${ROLE_JSON}]" \
      "${KEYCLOAK_BASE_URL}/admin/realms/${KEYCLOAK_REALM}/users/${USER_ID}/role-mappings/clients/${CLIENT_UUID}" >/dev/null 2>&1 || true
  fi
fi

echo
log "Test user ready"
echo "  Email:    ${TEST_EMAIL}"
echo "  Password: ${TEST_PASSWORD}"
echo "  Role:     ${TEST_ROLE}"
echo "  User ID:  ${USER_ID}"

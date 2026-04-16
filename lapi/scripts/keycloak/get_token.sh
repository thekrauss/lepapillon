#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# LePapillon — Get a JWT token for a user (ROPC flow)
# Usage: ./get_token.sh [email] [password]
# ============================================================================

KEYCLOAK_BASE_URL="${KEYCLOAK_BASE_URL:-http://localhost:8180}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-lepapillon}"
CLIENT_ID="${CLIENT_ID:-lepapillon-api}"
CLIENT_SECRET="${CLIENT_SECRET:-lepapillon-api-secret}"

EMAIL="${1:-cheffe@saveursthai.fr}"
PASSWORD="${2:-Test1234!}"

TOKEN_RESPONSE="$(
  curl -fsS -X POST \
    "${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "grant_type=password" \
    -d "client_id=${CLIENT_ID}" \
    -d "client_secret=${CLIENT_SECRET}" \
    -d "username=${EMAIL}" \
    -d "password=${PASSWORD}" \
    -d "scope=openid"
)"

ACCESS_TOKEN="$(echo "$TOKEN_RESPONSE" | jq -r '.access_token')"

if [ -z "$ACCESS_TOKEN" ] || [ "$ACCESS_TOKEN" = "null" ]; then
  echo "ERROR: Login failed" >&2
  echo "$TOKEN_RESPONSE" | jq . 2>/dev/null || echo "$TOKEN_RESPONSE"
  exit 1
fi

echo "==> Token obtained for ${EMAIL}" >&2

# Output just the token (pipe-friendly)
if [ -t 1 ]; then
  # Terminal: pretty output
  echo
  echo "Access Token:"
  echo "$ACCESS_TOKEN"
  echo
  echo "Decoded payload:"
  echo "$ACCESS_TOKEN" | cut -d. -f2 | base64 -d 2>/dev/null | jq . 2>/dev/null || true
  echo
  echo "curl example:"
  echo "  curl -H 'Authorization: Bearer ${ACCESS_TOKEN}' http://localhost:8080/api/v1/auth/profile"
else
  # Piped: just the token
  echo "$ACCESS_TOKEN"
fi

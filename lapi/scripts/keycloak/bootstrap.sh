#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# LePapillon — Keycloak Bootstrap Script
# Adapted from gophercart/scripts/keycloak/bootstrap_platform.sh
#
# Creates/reconciles:
#   - Realm "lepapillon"
#   - Client "lepapillon-api" (confidential, service account, ROPC)
#   - Client "lepapillon-admin" (confidential, service account)
#   - Client roles: admin, client
#   - Social identity providers: Google, Facebook (optional)
#   - Realm-management roles for admin service account
# ============================================================================

KEYCLOAK_BASE_URL="${KEYCLOAK_BASE_URL:-http://localhost:8180}"
KEYCLOAK_REALM="${KEYCLOAK_REALM:-lepapillon}"
KEYCLOAK_ADMIN_USER="${KEYCLOAK_ADMIN_USER:-admin}"
KEYCLOAK_ADMIN_PASSWORD="${KEYCLOAK_ADMIN_PASSWORD:-admin}"

# Clients
API_CLIENT_ID="${API_CLIENT_ID:-lepapillon-api}"
API_CLIENT_SECRET="${API_CLIENT_SECRET:-lepapillon-api-secret}"
ADMIN_CLIENT_ID="${ADMIN_CLIENT_ID:-lepapillon-admin}"
FRONTEND_BASE_URL="${FRONTEND_BASE_URL:-http://localhost:3000}"

# Social providers (disabled by default)
GOOGLE_IDP_ENABLED="${GOOGLE_IDP_ENABLED:-false}"
GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID:-}"
GOOGLE_CLIENT_SECRET="${GOOGLE_CLIENT_SECRET:-}"
FACEBOOK_IDP_ENABLED="${FACEBOOK_IDP_ENABLED:-false}"
FACEBOOK_CLIENT_ID="${FACEBOOK_CLIENT_ID:-}"
FACEBOOK_CLIENT_SECRET="${FACEBOOK_CLIENT_SECRET:-}"

# Realm-management roles for admin service account
REALM_MGMT_ROLES=("view-users" "manage-users" "view-clients" "manage-clients")

# ── Helpers ──────────────────────────────────────────────────────────

fail() { echo "ERROR: $*" >&2; exit 1; }
log()  { echo "==> $*" >&2; }

is_true() {
  case "${1:-}" in
    1|true|TRUE|yes|YES) return 0 ;;
    *) return 1 ;;
  esac
}

api() {
  local method="$1" path="$2" data="${3:-}"
  if [ -n "$data" ]; then
    curl -fsS -X "$method" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      -H "Content-Type: application/json" \
      -d "$data" "${KEYCLOAK_BASE_URL}${path}"
  else
    curl -fsS -X "$method" \
      -H "Authorization: Bearer ${ADMIN_TOKEN}" \
      "${KEYCLOAK_BASE_URL}${path}"
  fi
}

api_status() {
  curl -sS -o /dev/null -w "%{http_code}" -X "$1" \
    -H "Authorization: Bearer ${ADMIN_TOKEN}" \
    "${KEYCLOAK_BASE_URL}${2}"
}

get_admin_token() {
  ADMIN_TOKEN="$(
    curl -fsS -X POST "${KEYCLOAK_BASE_URL}/realms/master/protocol/openid-connect/token" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "grant_type=password&client_id=admin-cli&username=${KEYCLOAK_ADMIN_USER}&password=${KEYCLOAK_ADMIN_PASSWORD}" \
    | jq -r '.access_token'
  )"
  [ -n "${ADMIN_TOKEN}" ] || fail "could not obtain admin token"
}

get_client_uuid() {
  api GET "/admin/realms/${KEYCLOAK_REALM}/clients?clientId=${1}" |
    jq -r --arg cid "$1" '.[] | select(.clientId == $cid) | .id' | head -1
}

get_client_secret() {
  api GET "/admin/realms/${KEYCLOAK_REALM}/clients/${1}/client-secret" | jq -r '.value // empty'
}

# ── Realm ────────────────────────────────────────────────────────────

ensure_realm() {
  local code
  code="$(api_status GET "/admin/realms/${KEYCLOAK_REALM}")"
  if [ "$code" = "200" ]; then
    log "Realm ${KEYCLOAK_REALM} already exists"
  else
    log "Creating realm ${KEYCLOAK_REALM}"
    api POST "/admin/realms" "$(jq -n --arg r "$KEYCLOAK_REALM" '{
      realm: $r,
      enabled: true,
      registrationAllowed: true,
      registrationEmailAsUsername: true,
      resetPasswordAllowed: true,
      verifyEmail: false,
      loginWithEmailAllowed: true,
      sslRequired: "none",
      accessTokenLifespan: 900,
      internationalizationEnabled: true,
      supportedLocales: ["fr", "en"],
      defaultLocale: "fr"
    }')" >/dev/null
  fi
}

# ── API Client (confidential, ROPC + service account) ────────────────

ensure_api_client() {
  local uuid
  uuid="$(get_client_uuid "$API_CLIENT_ID")"

  local payload
  payload="$(jq -n \
    --arg cid "$API_CLIENT_ID" \
    --arg secret "$API_CLIENT_SECRET" \
    --arg frontendUrl "$FRONTEND_BASE_URL" \
    '{
      clientId: $cid,
      name: "LePapillon API",
      protocol: "openid-connect",
      enabled: true,
      publicClient: false,
      serviceAccountsEnabled: true,
      standardFlowEnabled: true,
      directAccessGrantsEnabled: true,
      secret: $secret,
      redirectUris: [
        ($frontendUrl + "/*"),
        "http://localhost:3000/*",
        "http://127.0.0.1:3000/*"
      ],
      webOrigins: [
        $frontendUrl,
        "http://localhost:3000",
        "http://127.0.0.1:3000"
      ],
      defaultClientScopes: ["openid", "profile", "email", "roles"],
      attributes: {
        "access.token.lifespan": "900"
      }
    }'
  )"

  if [ -n "$uuid" ]; then
    log "Reconciling API client ${API_CLIENT_ID} (${uuid})"
    api PUT "/admin/realms/${KEYCLOAK_REALM}/clients/${uuid}" "$payload" >/dev/null
  else
    log "Creating API client ${API_CLIENT_ID}"
    api POST "/admin/realms/${KEYCLOAK_REALM}/clients" "$payload" >/dev/null
  fi

  # Ensure client roles: admin, client
  uuid="$(get_client_uuid "$API_CLIENT_ID")"
  for role in admin client; do
    local code
    code="$(api_status GET "/admin/realms/${KEYCLOAK_REALM}/clients/${uuid}/roles/${role}")"
    if [ "$code" != "200" ]; then
      log "Creating client role: ${role}"
      api POST "/admin/realms/${KEYCLOAK_REALM}/clients/${uuid}/roles" \
        "$(jq -n --arg r "$role" '{name: $r}')" >/dev/null
    fi
  done

  # Audience mapper (so aud claim includes lepapillon-api)
  local mappers
  mappers="$(api GET "/admin/realms/${KEYCLOAK_REALM}/clients/${uuid}/protocol-mappers/models")"
  local has_aud
  has_aud="$(echo "$mappers" | jq '[.[] | select(.name == "lepapillon-api-audience")] | length')"
  if [ "$has_aud" = "0" ]; then
    log "Creating audience mapper for ${API_CLIENT_ID}"
    api POST "/admin/realms/${KEYCLOAK_REALM}/clients/${uuid}/protocol-mappers/models" "$(jq -n --arg cid "$API_CLIENT_ID" '{
      name: "lepapillon-api-audience",
      protocol: "openid-connect",
      protocolMapper: "oidc-audience-mapper",
      config: {
        "included.client.audience": $cid,
        "id.token.claim": "false",
        "access.token.claim": "true"
      }
    }')" >/dev/null
  fi
}

# ── Admin Client (service account only) ──────────────────────────────

ensure_admin_client() {
  local uuid
  uuid="$(get_client_uuid "$ADMIN_CLIENT_ID")"

  if [ -z "$uuid" ]; then
    log "Creating admin client ${ADMIN_CLIENT_ID}"
    api POST "/admin/realms/${KEYCLOAK_REALM}/clients" "$(jq -n --arg cid "$ADMIN_CLIENT_ID" '{
      clientId: $cid,
      name: "LePapillon Admin Service Account",
      protocol: "openid-connect",
      enabled: true,
      publicClient: false,
      serviceAccountsEnabled: true,
      standardFlowEnabled: false,
      directAccessGrantsEnabled: false
    }')" >/dev/null
    uuid="$(get_client_uuid "$ADMIN_CLIENT_ID")"
  else
    log "Admin client ${ADMIN_CLIENT_ID} already exists (${uuid})"
  fi

  # Assign realm-management roles to service account
  local sa_user_id rm_uuid
  sa_user_id="$(api GET "/admin/realms/${KEYCLOAK_REALM}/clients/${uuid}/service-account-user" | jq -r '.id')"
  rm_uuid="$(get_client_uuid "realm-management")"

  for role in "${REALM_MGMT_ROLES[@]}"; do
    local has_role
    has_role="$(api GET "/admin/realms/${KEYCLOAK_REALM}/users/${sa_user_id}/role-mappings/clients/${rm_uuid}" \
      | jq -e --arg r "$role" '.[] | select(.name == $r)' 2>/dev/null || true)"
    if [ -z "$has_role" ]; then
      local role_json
      role_json="$(api GET "/admin/realms/${KEYCLOAK_REALM}/clients/${rm_uuid}/roles/${role}")"
      log "Assigning realm-management role: ${role}"
      api POST "/admin/realms/${KEYCLOAK_REALM}/users/${sa_user_id}/role-mappings/clients/${rm_uuid}" "[${role_json}]" >/dev/null
    fi
  done

  echo "$uuid"
}

# ── Social Identity Providers ────────────────────────────────────────

ensure_social_provider() {
  local provider_id="$1" alias="$2" client_id="$3" client_secret="$4" display_name="$5" scope="$6"

  local code
  code="$(api_status GET "/admin/realms/${KEYCLOAK_REALM}/identity-provider/instances/${alias}")"

  local payload
  payload="$(jq -n \
    --arg alias "$alias" \
    --arg pid "$provider_id" \
    --arg dn "$display_name" \
    --arg cid "$client_id" \
    --arg cs "$client_secret" \
    --arg scope "$scope" \
    '{
      alias: $alias,
      providerId: $pid,
      displayName: $dn,
      enabled: true,
      trustEmail: true,
      storeToken: false,
      firstBrokerLoginFlowAlias: "first broker login",
      config: {
        clientId: $cid,
        clientSecret: $cs,
        defaultScope: $scope,
        useJwksUrl: "true"
      }
    }'
  )"

  if [ "$code" = "200" ]; then
    log "Reconciling identity provider: ${alias}"
    api PUT "/admin/realms/${KEYCLOAK_REALM}/identity-provider/instances/${alias}" "$payload" >/dev/null
  else
    log "Creating identity provider: ${alias}"
    api POST "/admin/realms/${KEYCLOAK_REALM}/identity-provider/instances" "$payload" >/dev/null
  fi
}

# ── Main ─────────────────────────────────────────────────────────────

main() {
  command -v curl >/dev/null || fail "curl is required"
  command -v jq >/dev/null || fail "jq is required"

  KEYCLOAK_BASE_URL="${KEYCLOAK_BASE_URL%/}"
  log "Keycloak: ${KEYCLOAK_BASE_URL}"
  log "Realm: ${KEYCLOAK_REALM}"

  log "Getting admin token..."
  get_admin_token

  ensure_realm
  ensure_api_client

  log "Ensuring admin client ${ADMIN_CLIENT_ID}"
  local admin_uuid
  admin_uuid="$(ensure_admin_client)"

  # Social providers
  if is_true "$GOOGLE_IDP_ENABLED"; then
    [ -n "$GOOGLE_CLIENT_ID" ] || fail "GOOGLE_CLIENT_ID required"
    [ -n "$GOOGLE_CLIENT_SECRET" ] || fail "GOOGLE_CLIENT_SECRET required"
    ensure_social_provider "google" "google" "$GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_SECRET" "Google" "openid email profile"
  else
    log "Google IDP: disabled"
  fi

  if is_true "$FACEBOOK_IDP_ENABLED"; then
    [ -n "$FACEBOOK_CLIENT_ID" ] || fail "FACEBOOK_CLIENT_ID required"
    [ -n "$FACEBOOK_CLIENT_SECRET" ] || fail "FACEBOOK_CLIENT_SECRET required"
    ensure_social_provider "facebook" "facebook" "$FACEBOOK_CLIENT_ID" "$FACEBOOK_CLIENT_SECRET" "Facebook" "email public_profile"
  else
    log "Facebook IDP: disabled"
  fi

  # Print summary
  local admin_secret
  admin_secret="$(get_client_secret "$(get_client_uuid "$ADMIN_CLIENT_ID")")"

  echo
  log "Bootstrap completed"
  echo "────────────────────────────────────────"
  echo "  Realm:           ${KEYCLOAK_REALM}"
  echo "  API Client:      ${API_CLIENT_ID}"
  echo "  Admin Client:    ${ADMIN_CLIENT_ID}"
  echo "  Admin Secret:    ${admin_secret}"
  echo "  Client Roles:    admin, client"
  echo
  echo "  Issuer URL:      ${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}"
  echo "  JWKS URL:        ${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/certs"
  echo

  if is_true "$GOOGLE_IDP_ENABLED"; then
    echo "  Google redirect:  ${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/broker/google/endpoint"
  fi
  if is_true "$FACEBOOK_IDP_ENABLED"; then
    echo "  Facebook redirect: ${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}/broker/facebook/endpoint"
  fi

  echo
  echo "  Add to your .env:"
  echo "    LEPAPILLON_OIDC_ADMIN_CLIENT_SECRET=${admin_secret}"
  echo "────────────────────────────────────────"
}

main "$@"

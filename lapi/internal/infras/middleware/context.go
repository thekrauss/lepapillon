package middleware

import (
	"context"
)

// Context key types — same pattern as gophercart.
type ctxKey string

const (
	ctxKeyUserID         ctxKey = "user_id"
	ctxKeyInternalUserID ctxKey = "internal_user_id"
	ctxKeyEmail          ctxKey = "email"
	ctxKeyTenantID       ctxKey = "tenant_id"
	ctxKeyRoles          ctxKey = "roles"
	ctxKeyScopes         ctxKey = "scopes"
)

// ── Setters (used by middleware) ─────────────────────────────────────

func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, ctxKeyUserID, userID)
}

func WithInternalUserID(ctx context.Context, id string) context.Context {
	return context.WithValue(ctx, ctxKeyInternalUserID, id)
}

func WithEmail(ctx context.Context, email string) context.Context {
	return context.WithValue(ctx, ctxKeyEmail, email)
}

func WithRoles(ctx context.Context, roles []string) context.Context {
	return context.WithValue(ctx, ctxKeyRoles, roles)
}

func WithScopes(ctx context.Context, scopes []string) context.Context {
	return context.WithValue(ctx, ctxKeyScopes, scopes)
}

func WithTenantID(ctx context.Context, tenantID string) context.Context {
	return context.WithValue(ctx, ctxKeyTenantID, tenantID)
}

// ── Getters (used by handlers) ──────────────────────────────────────

func UserIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(ctxKeyUserID).(string)
	return v, ok && v != ""
}

func InternalUserIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(ctxKeyInternalUserID).(string)
	return v, ok && v != ""
}

func UserEmailFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(ctxKeyEmail).(string)
	return v, ok && v != ""
}

func TenantIDFromContext(ctx context.Context) (string, bool) {
	v, ok := ctx.Value(ctxKeyTenantID).(string)
	return v, ok && v != ""
}

func RolesFromContext(ctx context.Context) ([]string, bool) {
	v, ok := ctx.Value(ctxKeyRoles).([]string)
	return v, ok
}

func ScopesFromContext(ctx context.Context) ([]string, bool) {
	v, ok := ctx.Value(ctxKeyScopes).([]string)
	return v, ok
}

package router

import (
	"context"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"github.com/thekrauss/lepapillon/internal/cache"
	"github.com/thekrauss/lepapillon/internal/infras/idempotency"
	"github.com/thekrauss/lepapillon/internal/infras/middleware"
	"github.com/thekrauss/lepapillon/internal/infras/worker"
	authsvc "github.com/thekrauss/lepapillon/internal/modules/auth/service"
)

// Init wires everything: infra deps → repos → services → controllers → middleware.
func (a *App) Init(ctx context.Context) error {
	if err := a.initDependencies(ctx); err != nil {
		return err
	}
	if err := a.initDomainLayers(); err != nil {
		return err
	}
	a.initMiddleware()
	return nil
}

func (a *App) initDependencies(ctx context.Context) error {
	if a.DB == nil {
		return fmt.Errorf("database is required")
	}

	// ── Task distributor (asynq / Redis) ────────────────────────────
	a.Distributor = worker.NewRedisTaskDistributor(a.redisClientOpt())

	// ── Idempotency manager ─────────────────────────────────────────
	a.Idempotency = idempotency.NewRedisManager(a.redisOptions(), 24*time.Hour)

	// ── Cache (Redis + Ristretto fallback) ──────────────────────────
	a.initCache(ctx)

	return nil
}

func (a *App) initCache(ctx context.Context) {
	if a.Config == nil {
		c, err := cache.NewRistrettoAuthCache()
		if err != nil {
			logrus.Fatalf("failed to initialize default ristretto cache: %v", err)
		}
		a.Cache = c
		return
	}
	a.Cache = cache.NewAuthCacheFromConfig(ctx, a.Config.Redis)
}

func (a *App) initMiddleware() {
	// Wire idempotency manager into middleware BEFORE building routes.
	if a.Idempotency != nil {
		middleware.SetIdempotencyManager(a.Idempotency, nil)
	}

	publicPaths := []string{
		"/api/v1/health",

		// Identity (Keycloak)
		"/api/v1/identity/register",
		"/api/v1/identity/login",
		"/api/v1/identity/refresh",
		"/api/v1/identity/forgot-password",
		"/api/v1/identity/social/google",
		"/api/v1/identity/social/facebook",
		"/api/v1/identity/social/callback",
		"/api/v1/identity/verify-email/resend",

		// Legacy local auth (when Keycloak is disabled)
		"/api/v1/auth/register",
		"/api/v1/auth/login",
		"/api/v1/auth/refresh",
		"/api/v1/auth/forgot-password",

		// Catalogue browsing (public) — prefix with * for sub-routes /:slug
		"/api/v1/catalogue/categories*",
		"/api/v1/catalogue/products*",

		// Prestation (public)
		"/api/v1/prestations/slots",
		"/api/v1/prestations/pricing",

		// Webhooks (verified by signature, not JWT)
		"/api/v1/webhooks/payments/stripe",

		// OpenAPI
		"/api/v1/openapi.json",
		"/openapi.json",
		"/docs",
	}

	a.Middleware = middleware.NewManager(
		a.Services.Auth,
		a.Cache,
		publicPaths,
		a.Config.JWT,
	)

	// Wire UserSync service for resolving OIDC users to local UUIDs
	if a.Services != nil && a.Services.AuthSync != nil {
		a.Middleware.SetUserSyncService(a.Services.AuthSync)
	}

	// Wire OIDC verifier for Keycloak token validation
	if a.Config.OIDC.Enabled {
		oidcVerifier, err := authsvc.NewOIDCAccessTokenVerifier(a.Config.OIDC)
		if err != nil {
			logrus.Warnf("OIDC verifier init failed: %v", err)
		} else if oidcVerifier != nil {
			a.Middleware.SetOIDCVerifier(oidcVerifier)
			logrus.Info("OIDC token verifier enabled in auth middleware")
		}
	}
}

package middleware

import (
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/thekrauss/lepapillon/internal/cache"
	"github.com/thekrauss/lepapillon/internal/core/config"
	"github.com/thekrauss/lepapillon/internal/core/domain"
	authsvc "github.com/thekrauss/lepapillon/internal/modules/auth/service"
)

// Manager holds the middleware dependencies and Gin route groups,
// matching gophercart's middleware.Manager pattern.
type Manager struct {
	authService  *authsvc.AuthService
	cache        cache.AuthCache
	jwtCfg       config.JWTConfig
	oidcVerifier authsvc.AccessTokenVerifier
	userSyncSvc  *authsvc.UserSyncService
	publicPaths  []string
	apiGroup     *gin.RouterGroup
}

func NewManager(
	auth *authsvc.AuthService,
	c cache.AuthCache,
	publicPaths []string,
	jwtCfg config.JWTConfig,
) *Manager {
	return &Manager{
		authService: auth,
		cache:       c,
		publicPaths: publicPaths,
		jwtCfg:      jwtCfg,
	}
}

// SetOIDCVerifier sets the OIDC access token verifier for Keycloak tokens.
func (m *Manager) SetOIDCVerifier(v authsvc.AccessTokenVerifier) {
	m.oidcVerifier = v
}

// SetAPIGroup stores the /api/v1 router group so route files can use it.
func (m *Manager) SetAPIGroup(g *gin.RouterGroup) {
	m.apiGroup = g
}

// APIGroup returns the authenticated /api/v1 Gin group.
func (m *Manager) APIGroup() *gin.RouterGroup {
	return m.apiGroup
}

// AuthMiddleware returns a Gin middleware that validates JWT Bearer tokens.
// Public paths are skipped.
//
// Auth priority (first match wins):
//  1. Cache Redis  — token déjà validé récemment, évite le re-parsing.
//  2. OIDC Keycloak (RS256) — source de vérité principale en production.
//     Tous les tokens émis par /identity/login passent par là.
//  3. JWT HS256 local — fallback dev uniquement (Keycloak absent ou désactivé).
//     En production, s'assurer que OIDC est activé pour ne jamais atteindre ce chemin.
func (m *Manager) AuthMiddleware() gin.HandlerFunc {
	publicSet := make(map[string]struct{}, len(m.publicPaths))
	for _, p := range m.publicPaths {
		publicSet[p] = struct{}{}
	}

	// Split paths into exact matches and prefix patterns (ending with *)
	exactSet := make(map[string]struct{})
	var prefixPaths []string
	for p := range publicSet {
		if strings.HasSuffix(p, "*") {
			prefixPaths = append(prefixPaths, strings.TrimSuffix(p, "*"))
		} else {
			exactSet[p] = struct{}{}
		}
	}

	return func(c *gin.Context) {
		path := c.Request.URL.Path

		// Exact match (safe — no prefix bypass)
		if _, ok := exactSet[path]; ok {
			c.Next()
			return
		}
		if _, ok := exactSet[strings.TrimRight(path, "/")]; ok {
			c.Next()
			return
		}
		// Prefix match only for explicitly opted-in patterns (catalogue/*, etc.)
		for _, prefix := range prefixPaths {
			if strings.HasPrefix(path, prefix) {
				c.Next()
				return
			}
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			domain.AbortWithError(c, domain.ErrUnauthorized)
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "bearer") {
			domain.AbortWithError(c, domain.ErrUnauthorized)
			return
		}

		tokenStr := parts[1]

		// Check cache first (avoid re-parsing JWT on every request)
		if m.cache != nil {
			cached, found, _ := m.cache.GetAccessTokenClaims(c.Request.Context(), tokenStr)
			if found {
				// Check JTI blacklist (logout)
				if cached.JTI != "" {
					blacklisted, _ := m.cache.IsAccessTokenJTIBlacklisted(c.Request.Context(), cached.JTI)
					if blacklisted {
						domain.AbortWithError(c, domain.ErrUnauthorized)
						return
					}
				}
				c.Set("user_id", cached.UserID)
				c.Set("email", cached.Email)
				c.Set("role", resolveAppRole(cached.Roles))
				c.Next()
				return
			}
		}

		// Try OIDC (Keycloak RS256) first, then fallback to local HS256 JWT
		if m.oidcVerifier != nil {
			principal, err := m.oidcVerifier.VerifyAccessToken(c.Request.Context(), tokenStr)
			if err == nil {
				// Check JTI blacklist
				if principal.JTI != "" && m.cache != nil {
					blacklisted, _ := m.cache.IsAccessTokenJTIBlacklisted(c.Request.Context(), principal.JTI)
					if blacklisted {
						domain.AbortWithError(c, domain.ErrUnauthorized)
						return
					}
				}

				role := resolveAppRole(principal.Roles)

				// Cache for future requests
				if m.cache != nil {
					ttl := time.Until(time.Unix(principal.ExpiresAt, 0))
					if ttl > 0 {
						_ = m.cache.SetAccessTokenClaims(c.Request.Context(), tokenStr, cache.AccessTokenClaims{
							UserID: principal.UserID,
							Email:  principal.Email,
							Roles:  principal.Roles,
							JTI:    principal.JTI,
						}, ttl)
					}
				}

				c.Set("user_id", principal.UserID)
				c.Set("email", principal.Email)
				c.Set("role", role)
				c.Next()
				return
			}
		}

		// Fallback: local HS256 JWT (dev uniquement — ne doit pas être atteint en prod si OIDC est activé)
		claims, err := ParseJWT(tokenStr, m.jwtCfg.Secret)
		if err != nil {
			domain.AbortWithError(c, domain.ErrUnauthorized)
			return
		}

		// Store in cache for future requests
		if m.cache != nil {
			ttl := time.Until(claims.ExpiresAt.Time)
			if ttl > 0 {
				_ = m.cache.SetAccessTokenClaims(c.Request.Context(), tokenStr, cache.AccessTokenClaims{
					UserID: claims.UserID,
					Email:  claims.Email,
					Roles:  []string{claims.Role},
				}, ttl)
			}
		}

		// inject claims into Gin context
		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Set("claims", claims)
		c.Next()
	}
}

// SetUserSyncService sets the user sync service for resolving OIDC users to local UUIDs.
func (m *Manager) SetUserSyncService(svc *authsvc.UserSyncService) {
	m.userSyncSvc = svc
}

// UserSyncGinMiddleware creates a Gin middleware that synchronizes OIDC users
// with the local database and sets the internal user UUID.
func (m *Manager) UserSyncGinMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if m.userSyncSvc == nil || m.oidcVerifier == nil {
			c.Next()
			return
		}

		// Only sync for authenticated requests
		rawUserID, exists := c.Get("user_id")
		if !exists {
			c.Next()
			return
		}

		userIDStr, ok := rawUserID.(string)
		if !ok || userIDStr == "" {
			c.Next()
			return
		}

		email, _ := c.Get("email")
		emailStr, _ := email.(string)
		role, _ := c.Get("role")
		roleStr, _ := role.(string)

		principal := &authsvc.Principal{
			UserID: userIDStr,
			Email:  emailStr,
			Roles:  []string{roleStr},
		}

		localID, err := m.userSyncSvc.SyncOIDCUser(c.Request.Context(), principal)
		if err == nil && localID.String() != "00000000-0000-0000-0000-000000000000" {
			c.Set("user_id", localID.String())
		}

		c.Next()
	}
}

// RequireRole returns a Gin middleware that checks the user's role.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}
	return func(c *gin.Context) {
		raw, exists := c.Get("role")
		if !exists {
			domain.AbortWithError(c, domain.ErrForbidden)
			return
		}
		roleStr, ok := raw.(string)
		if !ok || !allowed[roleStr] {
			domain.AbortWithError(c, domain.ErrForbidden)
			return
		}
		c.Next()
	}
}

// resolveAppRole picks the most relevant application role from a list of
// Keycloak realm roles (which includes built-in roles like offline_access).
func resolveAppRole(roles []string) string {
	for _, r := range roles {
		if strings.EqualFold(r, "admin") {
			return "admin"
		}
	}
	for _, r := range roles {
		if strings.EqualFold(r, "client") {
			return "client"
		}
	}
	if len(roles) > 0 {
		return roles[0]
	}
	return ""
}

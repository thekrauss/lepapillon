package router

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/thekrauss/lepapillon/internal/infras/middleware"
	identity "github.com/thekrauss/lepapillon/internal/modules/identity"
	identitykeycloak "github.com/thekrauss/lepapillon/internal/modules/identity/keycloak"
	identitysvc "github.com/thekrauss/lepapillon/internal/modules/identity/services"
	identitytypes "github.com/thekrauss/lepapillon/internal/modules/identity/types"
)

// M1 FIX: per-IP rate limiter for auth endpoints — 10 requests/minute
var authRateLimiter = middleware.NewAuthRateLimiter(10, time.Minute)

var (
	IdentityGroup = RootGroup.NewGroup("/identity", "Inscription, connexion, social login, mot de passe")
)

func addIdentityRoutes(a *App) {
	if a == nil || a.Controllers == nil || a.Controllers.Identity == nil {
		return
	}
	ctrl := a.Controllers.Identity

	// M1 FIX: apply auth rate-limit to all identity routes
	IdentityGroup.Middlewares = append(IdentityGroup.Middlewares, authRateLimiter.Middleware())

	// ── Public ────────────────────────────────────────────────────
	IdentityGroup.AddRoute("/register", http.MethodPost, "Créer un compte Keycloak", identityRegisterHandler(ctrl)).
		AddPayload(&identitytypes.RegisterRequest{}).
		AddResponse(http.StatusCreated, "Utilisateur créé", &identitytypes.RegisterResponse{}).
		AddResponse(http.StatusConflict, "Email déjà existant", &identitytypes.ErrorResponse{})

	IdentityGroup.AddRoute("/login", http.MethodPost, "Authentification (ROPC)", identityLoginHandler(ctrl)).
		AddPayload(&identitytypes.LoginRequest{}).
		AddResponse(http.StatusOK, "Tokens", &identitytypes.LoginResponse{}).
		AddResponse(http.StatusUnauthorized, "Identifiants invalides", &identitytypes.ErrorResponse{})

	IdentityGroup.AddRoute("/refresh", http.MethodPost, "Renouveler les tokens", identityRefreshHandler(ctrl)).
		AddPayload(&identitytypes.RefreshTokenRequest{}).
		AddResponse(http.StatusOK, "Nouveaux tokens", &identitytypes.RefreshTokenResponse{})

	IdentityGroup.AddRoute("/forgot-password", http.MethodPost, "Email de réinitialisation", identityForgotPasswordHandler(ctrl)).
		AddPayload(&identitytypes.ForgotPasswordRequest{}).
		AddResponse(http.StatusNoContent, "Email envoyé", nil)

	IdentityGroup.AddRoute("/social/:provider", http.MethodGet, "URL de connexion sociale", identitySocialLoginURLHandler(ctrl)).
		AddResponse(http.StatusOK, "URL Keycloak", &identitytypes.SocialLoginURLResponse{})

	IdentityGroup.AddRoute("/social/callback", http.MethodGet, "Callback social login", identitySocialCallbackHandler(ctrl)).
		AddResponse(http.StatusOK, "Tokens", &identitytypes.LoginResponse{})

	// ── Authenticated ─────────────────────────────────────────────
	IdentityGroup.AddRoute("/logout", http.MethodPost, "Invalider la session", identityLogoutHandler(ctrl)).
		AddPayload(&identitytypes.LogoutRequest{}).
		AddResponse(http.StatusNoContent, "Session invalidée", nil)

	IdentityGroup.AddRoute("/change-password", http.MethodPost, "Changer le mot de passe", identityChangePasswordHandler(ctrl)).
		AddPayload(&identitytypes.ChangePasswordRequest{}).
		AddResponse(http.StatusNoContent, "Mot de passe modifié", nil)

	IdentityGroup.AddRoute("/verify-email/resend", http.MethodPost, "Renvoyer email de vérification", identityResendVerificationHandler(ctrl)).
		AddResponse(http.StatusNoContent, "Email envoyé", nil)
}

// ── Handler wrappers (same pattern as gophercart) ───────────────────

func identityRegisterHandler(ctrl identity.Controller) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req identitytypes.RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_REQUEST", "message": err.Error()})
			return
		}
		resp, err := ctrl.Register(c, &req)
		if err != nil {
			writeIdentityRouteError(c, err)
			return
		}
		c.JSON(http.StatusCreated, resp)
	}
}

func identityLoginHandler(ctrl identity.Controller) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req identitytypes.LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_REQUEST", "message": err.Error()})
			return
		}
		resp, err := ctrl.Login(c.Request.Context(), req)
		if err != nil {
			writeIdentityRouteError(c, err)
			return
		}
		c.JSON(http.StatusOK, resp)
	}
}

func identityRefreshHandler(ctrl identity.Controller) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req identitytypes.RefreshTokenRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_REQUEST", "message": err.Error()})
			return
		}
		resp, err := ctrl.RefreshToken(c.Request.Context(), req)
		if err != nil {
			writeIdentityRouteError(c, err)
			return
		}
		c.JSON(http.StatusOK, resp)
	}
}

func identityForgotPasswordHandler(ctrl identity.Controller) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req identitytypes.ForgotPasswordRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_REQUEST", "message": err.Error()})
			return
		}
		_ = ctrl.ForgotPassword(c.Request.Context(), req)
		c.Status(http.StatusNoContent)
	}
}

func identityLogoutHandler(ctrl identity.Controller) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req identitytypes.LogoutRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_REQUEST", "message": err.Error()})
			return
		}
		req.AccessToken = c.GetHeader("Authorization")
		if _, err := ctrl.Logout(c.Request.Context(), req); err != nil {
			writeIdentityRouteError(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	}
}

func identityChangePasswordHandler(ctrl identity.Controller) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req identitytypes.ChangePasswordRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_REQUEST", "message": err.Error()})
			return
		}
		if err := ctrl.ChangePassword(c.Request.Context(), req); err != nil {
			writeIdentityRouteError(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	}
}

func identitySocialLoginURLHandler(ctrl identity.Controller) gin.HandlerFunc {
	return func(c *gin.Context) {
		provider := c.Param("provider")
		redirectURI := c.Query("redirect_uri")
		resp, err := ctrl.SocialLoginURL(c.Request.Context(), provider, redirectURI)
		if err != nil {
			writeIdentityRouteError(c, err)
			return
		}
		c.JSON(http.StatusOK, resp)
	}
}

func identitySocialCallbackHandler(ctrl identity.Controller) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req identitytypes.SocialCallbackRequest
		if err := c.ShouldBindQuery(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_REQUEST", "message": err.Error()})
			return
		}
		resp, err := ctrl.SocialCallback(c.Request.Context(), req)
		if err != nil {
			writeIdentityRouteError(c, err)
			return
		}
		c.JSON(http.StatusOK, resp)
	}
}

func identityResendVerificationHandler(ctrl identity.Controller) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := ctrl.ResendVerificationEmail(c.Request.Context()); err != nil {
			writeIdentityRouteError(c, err)
			return
		}
		c.Status(http.StatusNoContent)
	}
}

// ── Error mapping ───────────────────────────────────────────────────

func writeIdentityRouteError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, identitykeycloak.ErrInvalidCredentials):
		c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_CREDENTIALS", "message": "identifiants invalides"})
	case errors.Is(err, identitykeycloak.ErrUserAlreadyExists):
		c.JSON(http.StatusConflict, gin.H{"error": "USER_ALREADY_EXISTS", "message": "cet email est déjà utilisé"})
	case errors.Is(err, identitykeycloak.ErrUserNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "USER_NOT_FOUND", "message": "utilisateur introuvable"})
	case errors.Is(err, identitysvc.ErrEmailAlreadyUsed):
		c.JSON(http.StatusConflict, gin.H{"error": "EMAIL_ALREADY_USED", "message": err.Error()})
	case errors.Is(err, identitysvc.ErrInvalidCredentials):
		c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_CREDENTIALS", "message": err.Error()})
	case errors.Is(err, identitysvc.ErrInvalidState):
		c.JSON(http.StatusUnauthorized, gin.H{"error": "INVALID_OAUTH_STATE", "message": "invalid or expired oauth state token"})
	case errors.Is(err, identitysvc.ErrInvalidRedirectURI):
		c.JSON(http.StatusBadRequest, gin.H{"error": "INVALID_REDIRECT_URI", "message": "redirect_uri not in allowlist"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "INTERNAL_ERROR"})
	}
}

package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/sirupsen/logrus"
	"github.com/thekrauss/lepapillon/internal/modules/identity/keycloak"
)

// Deps holds all dependencies for the identity service.
type Deps struct {
	Keycloak            keycloak.KeycloakClient
	FrontendBaseURL     string
	OIDCClientID        string
	AllowedRedirectURIs []string // M4+M5 FIX: allowlist for redirect_uri
}

type Service interface {
	Register(ctx context.Context, req RegisterRequest) (*RegisterResponse, error)
	Login(ctx context.Context, req LoginRequest) (*LoginResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*LoginResponse, error)
	Logout(ctx context.Context, refreshToken string) error
	ForgotPassword(ctx context.Context, email string) error
	ChangePassword(ctx context.Context, keycloakUserID, newPassword string) error
	SocialLoginURL(provider, redirectURI, state string) (string, error)
	SocialCallback(ctx context.Context, code, state, redirectURI string) (*LoginResponse, error)
	ResendVerificationEmail(ctx context.Context, keycloakUserID string) error
}

type identityService struct {
	kc                  keycloak.KeycloakClient
	frontendBaseURL     string
	oidcClientID        string
	allowedRedirectURIs map[string]struct{} // M4+M5 FIX
	oauthStates         sync.Map            // M7 FIX: CSRF state tokens
}

func NewService(deps Deps) Service {
	allowed := make(map[string]struct{}, len(deps.AllowedRedirectURIs)+2)
	base := strings.TrimRight(strings.TrimSpace(deps.FrontendBaseURL), "/")
	if base != "" {
		allowed[base] = struct{}{}
		allowed[base+"/"] = struct{}{}
	}
	for _, uri := range deps.AllowedRedirectURIs {
		if u := strings.TrimSpace(uri); u != "" {
			allowed[u] = struct{}{}
		}
	}
	return &identityService{
		kc:                  deps.Keycloak,
		frontendBaseURL:     base,
		oidcClientID:        strings.TrimSpace(deps.OIDCClientID),
		allowedRedirectURIs: allowed,
	}
}

// ── Register ────────────────────────────────────────────────────────

type RegisterRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Password    string `json:"password" binding:"required,min=8"`
	FullName    string `json:"full_name" binding:"required,min=2"`
	PhoneNumber string `json:"phone_number"`
}

type RegisterResponse struct {
	KeycloakUserID string `json:"keycloak_user_id"`
	Email          string `json:"email"`
}

func (s *identityService) Register(ctx context.Context, req RegisterRequest) (*RegisterResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))

	profile, err := s.kc.CreateUser(ctx, keycloak.CreateUserInput{
		Email:         email,
		Password:      req.Password,
		FullName:      req.FullName,
		PhoneNumber:   req.PhoneNumber,
		Enabled:       true,
		EmailVerified: false,
	})
	if err != nil {
		if errors.Is(err, keycloak.ErrUserAlreadyExists) {
			return nil, ErrEmailAlreadyUsed
		}
		return nil, err
	}

	// Send verification email
	opts := &keycloak.ActionEmailOptions{
		ClientID:    s.oidcClientID,
		RedirectURI: s.frontendBaseURL + "/connexion",
	}
	if err := s.kc.SendVerificationEmail(ctx, profile.ID, opts); err != nil {
		logrus.WithError(err).Warn("failed to send verification email")
	}

	// L7: audit registration
	logrus.WithFields(logrus.Fields{
		"keycloak_user_id": profile.ID,
		"email":            profile.Email,
		"event":            "register",
	}).Info("new user registered")

	return &RegisterResponse{
		KeycloakUserID: profile.ID,
		Email:          profile.Email,
	}, nil
}

// ── Login ───────────────────────────────────────────────────────────

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

func (s *identityService) Login(ctx context.Context, req LoginRequest) (*LoginResponse, error) {
	email := strings.ToLower(strings.TrimSpace(req.Email))
	pair, err := s.kc.Login(ctx, email, req.Password)
	if err != nil {
		// L7: audit failed login attempt
		logrus.WithFields(logrus.Fields{
			"email": email,
			"event": "login_failed",
		}).Warn("failed login attempt")
		if errors.Is(err, keycloak.ErrInvalidCredentials) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	// L7: audit successful login
	logrus.WithFields(logrus.Fields{
		"email": email,
		"event": "login_success",
	}).Info("user logged in")

	return &LoginResponse{
		AccessToken:  pair.AccessToken,
		RefreshToken: pair.RefreshToken,
		ExpiresIn:    pair.ExpiresIn,
	}, nil
}

// ── Refresh ─────────────────────────────────────────────────────────

func (s *identityService) RefreshToken(ctx context.Context, refreshToken string) (*LoginResponse, error) {
	pair, err := s.kc.RefreshToken(ctx, refreshToken)
	if err != nil {
		if errors.Is(err, keycloak.ErrInvalidCredentials) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}
	return &LoginResponse{
		AccessToken:  pair.AccessToken,
		RefreshToken: pair.RefreshToken,
		ExpiresIn:    pair.ExpiresIn,
	}, nil
}

// ── Logout ──────────────────────────────────────────────────────────

func (s *identityService) Logout(ctx context.Context, refreshToken string) error {
	logrus.WithField("event", "logout").Info("user session revoked")
	return s.kc.Logout(ctx, refreshToken)
}

// ── Forgot Password ─────────────────────────────────────────────────

func (s *identityService) ForgotPassword(ctx context.Context, email string) error {
	email = strings.ToLower(strings.TrimSpace(email))
	profile, err := s.kc.FindUserByEmail(ctx, email)
	if err != nil {
		// Don't leak whether user exists
		if errors.Is(err, keycloak.ErrUserNotFound) {
			return nil
		}
		return err
	}

	opts := &keycloak.ActionEmailOptions{
		ClientID:    s.oidcClientID,
		RedirectURI: s.frontendBaseURL + "/connexion",
	}
	return s.kc.ExecuteActionsEmail(ctx, profile.ID, []string{"UPDATE_PASSWORD"}, opts)
}

// ── Change Password ──────────────────────────────────────────────────

func (s *identityService) ChangePassword(ctx context.Context, keycloakUserID, newPassword string) error {
	// L7: audit password change
	logrus.WithFields(logrus.Fields{
		"keycloak_user_id": keycloakUserID,
		"event":            "password_changed",
	}).Info("user changed password")
	return s.kc.ResetPassword(ctx, keycloakUserID, newPassword)
}

// ── Social Login ────────────────────────────────────────────────────

func (s *identityService) SocialLoginURL(provider, redirectURI, state string) (string, error) {
	// M4 FIX: validate redirect_uri against allowlist
	if err := s.validateRedirectURI(redirectURI); err != nil {
		return "", err
	}

	// M7 FIX: generate CSRF state token if not provided
	if state == "" {
		b := make([]byte, 16)
		if _, err := rand.Read(b); err != nil {
			return "", fmt.Errorf("generate state token: %w", err)
		}
		state = hex.EncodeToString(b)
	}
	// Store state for validation in callback
	s.oauthStates.Store(state, true)

	// L7: audit log
	logrus.WithFields(logrus.Fields{
		"provider":     provider,
		"redirect_uri": redirectURI,
	}).Info("social login URL requested")

	url := s.kc.GetSocialLoginURL(provider, redirectURI, state)
	return url, nil
}

func (s *identityService) SocialCallback(ctx context.Context, code, state, redirectURI string) (*LoginResponse, error) {
	// M7 FIX: validate CSRF state token
	if state != "" {
		if _, loaded := s.oauthStates.LoadAndDelete(state); !loaded {
			return nil, ErrInvalidState
		}
	}

	// M5 FIX: validate redirect_uri against allowlist
	if err := s.validateRedirectURI(redirectURI); err != nil {
		return nil, err
	}

	pair, err := s.kc.ExchangeCodeForToken(ctx, code, redirectURI)
	if err != nil {
		return nil, err
	}

	// L7: audit log
	logrus.Info("social login callback completed successfully")

	return &LoginResponse{
		AccessToken:  pair.AccessToken,
		RefreshToken: pair.RefreshToken,
		ExpiresIn:    pair.ExpiresIn,
	}, nil
}

// validateRedirectURI checks the URI against the configured allowlist.
func (s *identityService) validateRedirectURI(uri string) error {
	uri = strings.TrimSpace(uri)
	if uri == "" {
		return nil // empty is OK — Keycloak uses its default
	}
	if len(s.allowedRedirectURIs) == 0 {
		return nil // no allowlist configured — allow all (dev mode)
	}
	if _, ok := s.allowedRedirectURIs[uri]; ok {
		return nil
	}
	// Also allow URIs that are under the frontend base URL
	if s.frontendBaseURL != "" && strings.HasPrefix(uri, s.frontendBaseURL) {
		return nil
	}
	return ErrInvalidRedirectURI
}

// ── Resend Verification ─────────────────────────────────────────────

func (s *identityService) ResendVerificationEmail(ctx context.Context, keycloakUserID string) error {
	opts := &keycloak.ActionEmailOptions{
		ClientID:    s.oidcClientID,
		RedirectURI: s.frontendBaseURL + "/connexion",
	}
	return s.kc.SendVerificationEmail(ctx, keycloakUserID, opts)
}

// ── Errors ──────────────────────────────────────────────────────────

var (
	ErrEmailAlreadyUsed   = errors.New("email already in use")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrInvalidState       = errors.New("invalid or expired oauth state token")
	ErrInvalidRedirectURI = errors.New("redirect_uri not in allowlist")
)

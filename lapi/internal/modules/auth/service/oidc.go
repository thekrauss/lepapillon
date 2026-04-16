package service

import (
	"context"
	"crypto"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/thekrauss/lepapillon/internal/core/config"
)

// Principal represents the authenticated user extracted from an OIDC token.
type Principal struct {
	UserID    string   // Keycloak sub claim
	Email     string
	Roles     []string
	ExpiresAt int64
	JTI       string
	Issuer    string
	Audience  []string
}

// AccessTokenVerifier validates OIDC access tokens (RS256 JWT from Keycloak).
type AccessTokenVerifier interface {
	VerifyAccessToken(ctx context.Context, rawToken string) (*Principal, error)
}

type oidcVerifier struct {
	issuerURL        string
	jwksURL          string
	expectedClientID string
	strictAudience   bool
	clockSkew        time.Duration
	httpClient       *http.Client
	jwksCache        *jwksCache
}

type keycloakClaims struct {
	Sub               string `json:"sub"`
	Email             string `json:"email,omitempty"`
	PreferredUsername string `json:"preferred_username,omitempty"`
	Iss               string `json:"iss"`
	Azp               string `json:"azp,omitempty"`
	Aud               any    `json:"aud,omitempty"`
	Exp               int64  `json:"exp"`
	Iat               int64  `json:"iat,omitempty"`
	Nbf               int64  `json:"nbf,omitempty"`
	JTI               string `json:"jti,omitempty"`

	RealmAccess struct {
		Roles []string `json:"roles,omitempty"`
	} `json:"realm_access,omitempty"`

	ResourceAccess map[string]struct {
		Roles []string `json:"roles,omitempty"`
	} `json:"resource_access,omitempty"`
}

type jwtOIDCHeader struct {
	Algorithm string `json:"alg"`
	Type      string `json:"typ"`
	KeyID     string `json:"kid"`
}

// NewOIDCAccessTokenVerifier creates an OIDC verifier from config.
// Returns nil if OIDC is disabled.
func NewOIDCAccessTokenVerifier(cfg config.OIDCConfig) (AccessTokenVerifier, error) {
	if !cfg.Enabled {
		return nil, nil
	}
	issuerURL := strings.TrimSpace(cfg.Issuer)
	if issuerURL == "" {
		return nil, errors.New("oidc issuer is required")
	}
	clientID := strings.TrimSpace(cfg.ClientID)
	if clientID == "" {
		clientID = strings.TrimSpace(cfg.Audience)
	}
	httpClient := &http.Client{Timeout: 5 * time.Second}
	return &oidcVerifier{
		issuerURL:        issuerURL,
		jwksURL:          strings.TrimSpace(cfg.JWKSURL),
		expectedClientID: clientID,
		strictAudience:   cfg.StrictAudience,
		clockSkew:        30 * time.Second,
		httpClient:       httpClient,
		jwksCache:        newJWKSCache(10*time.Minute, httpClient),
	}, nil
}

func (v *oidcVerifier) VerifyAccessToken(ctx context.Context, rawToken string) (*Principal, error) {
	token := strings.TrimSpace(rawToken)
	if strings.HasPrefix(strings.ToLower(token), "bearer ") {
		token = strings.TrimSpace(token[7:])
	}
	if token == "" {
		return nil, errors.New("access token is required")
	}

	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return nil, errors.New("invalid token format")
	}

	// Parse header
	headerRaw, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, errors.New("invalid token header encoding")
	}
	var header jwtOIDCHeader
	if err := json.Unmarshal(headerRaw, &header); err != nil {
		return nil, errors.New("invalid token header")
	}
	if header.Algorithm != "RS256" {
		return nil, errors.New("unsupported token algorithm")
	}
	if strings.TrimSpace(header.KeyID) == "" {
		return nil, errors.New("missing token kid")
	}

	// Verify signature
	unsigned := parts[0] + "." + parts[1]
	signature, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return nil, errors.New("invalid token signature encoding")
	}
	jwksURL := v.resolveJWKSURL(ctx)
	publicKey, err := v.jwksCache.GetPublicKey(ctx, jwksURL, header.KeyID)
	if err != nil {
		return nil, err
	}
	sum := sha256.Sum256([]byte(unsigned))
	if err := rsa.VerifyPKCS1v15(publicKey, crypto.SHA256, sum[:], signature); err != nil {
		return nil, fmt.Errorf("invalid token signature: %w", err)
	}

	// Parse claims
	claimsRaw, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, errors.New("invalid token payload encoding")
	}
	var claims keycloakClaims
	if err := json.Unmarshal(claimsRaw, &claims); err != nil {
		return nil, errors.New("invalid token payload")
	}

	if err := v.validateClaims(claims); err != nil {
		return nil, err
	}
	if err := v.validateAudience(claims); err != nil {
		return nil, err
	}

	roles := v.extractRoles(claims)
	userID := strings.TrimSpace(claims.Sub)
	if userID == "" {
		// Keycloak may omit sub in some configurations; use email as identifier
		userID = strings.ToLower(strings.TrimSpace(claims.Email))
	}
	return &Principal{
		UserID:    userID,
		Email:     strings.ToLower(strings.TrimSpace(claims.Email)),
		Roles:     roles,
		ExpiresAt: claims.Exp,
		JTI:       claims.JTI,
		Issuer:    claims.Iss,
		Audience:  normalizeAudience(claims.Aud),
	}, nil
}

func (v *oidcVerifier) resolveJWKSURL(ctx context.Context) string {
	if v.jwksURL != "" {
		return v.jwksURL
	}
	discoveryURL := strings.TrimRight(v.issuerURL, "/") + "/.well-known/openid-configuration"
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, discoveryURL, nil)
	if err != nil {
		return ""
	}
	resp, err := v.httpClient.Do(req)
	if err != nil {
		return ""
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return ""
	}
	var discovery struct {
		JWKSURI string `json:"jwks_uri"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&discovery); err != nil {
		return ""
	}
	v.jwksURL = strings.TrimSpace(discovery.JWKSURI)
	return v.jwksURL
}

func (v *oidcVerifier) validateClaims(claims keycloakClaims) error {
	now := time.Now().UTC().Unix()
	skew := int64(v.clockSkew.Seconds())
	// sub may be absent in some Keycloak configurations; fall back to email
	if strings.TrimSpace(claims.Sub) == "" && strings.TrimSpace(claims.Email) == "" {
		return errors.New("invalid token subject")
	}
	if claims.Iss != v.issuerURL {
		return errors.New("invalid token issuer")
	}
	if strings.TrimSpace(claims.JTI) == "" {
		return errors.New("missing token jti")
	}
	if claims.Exp <= now-skew {
		return errors.New("token expired")
	}
	return nil
}

func (v *oidcVerifier) validateAudience(claims keycloakClaims) error {
	if v.expectedClientID == "" {
		return nil
	}
	if audContains(claims.Aud, v.expectedClientID) {
		return nil
	}
	if !v.strictAudience {
		// Check resource_access for client-specific roles
		if _, ok := claims.ResourceAccess[v.expectedClientID]; ok {
			return nil
		}
		// Check azp (authorized party) — Keycloak sets this for the requesting client
		if claims.Azp != "" {
			return nil
		}
	}
	return errors.New("invalid token audience")
}

func (v *oidcVerifier) extractRoles(claims keycloakClaims) []string {
	roles := make([]string, 0)
	roles = append(roles, claims.RealmAccess.Roles...)
	if access, ok := claims.ResourceAccess[v.expectedClientID]; ok {
		roles = append(roles, access.Roles...)
	}
	return roles
}

func normalizeAudience(value any) []string {
	switch aud := value.(type) {
	case string:
		if s := strings.TrimSpace(aud); s != "" {
			return []string{s}
		}
		return nil
	case []any:
		out := make([]string, 0, len(aud))
		for _, item := range aud {
			if str, ok := item.(string); ok {
				if s := strings.TrimSpace(str); s != "" {
					out = append(out, s)
				}
			}
		}
		return out
	default:
		return nil
	}
}

func audContains(value any, expected string) bool {
	for _, aud := range normalizeAudience(value) {
		if aud == expected {
			return true
		}
	}
	return false
}

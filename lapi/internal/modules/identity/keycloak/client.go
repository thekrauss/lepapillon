package keycloak

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
)

// KeycloakClient defines the contract for the Keycloak Admin API.
// Same interface as gophercart.
type KeycloakClient interface {
	CreateUser(ctx context.Context, input CreateUserInput) (*UserProfile, error)
	GetUserByID(ctx context.Context, keycloakUserID string) (*UserProfile, error)
	FindUserByEmail(ctx context.Context, email string) (*UserProfile, error)

	Login(ctx context.Context, email, password string) (*TokenPair, error)
	RefreshToken(ctx context.Context, refreshToken string) (*TokenPair, error)
	Logout(ctx context.Context, refreshToken string) error

	ExecuteActionsEmail(ctx context.Context, userID string, actions []string, opts *ActionEmailOptions) error
	SendVerificationEmail(ctx context.Context, userID string, opts *ActionEmailOptions) error
	ResetPassword(ctx context.Context, keycloakUserID, newPassword string) error
	LogoutAllSessions(ctx context.Context, keycloakUserID string) error

	GetSocialLoginURL(idpName, redirectURI, state string) string
	ExchangeCodeForToken(ctx context.Context, code, redirectURI string) (*TokenPair, error)

	ImpersonateUser(ctx context.Context, adminToken string, targetKeycloakUserID string) (*TokenPair, error)
}

var (
	ErrUserNotFound       = errors.New("keycloak user not found")
	ErrUserAlreadyExists  = errors.New("keycloak user already exists")
	ErrInvalidCredentials = errors.New("invalid credentials")
)

type TokenPair struct {
	AccessToken  string
	RefreshToken string
	ExpiresIn    int64
}

type ActionEmailOptions struct {
	ClientID    string
	RedirectURI string
}

type AdminConfig struct {
	BaseURL      string
	Realm        string
	ClientID     string
	ClientSecret string
	Timeout      time.Duration
}

type CreateUserInput struct {
	Email         string
	Password      string
	FullName      string
	PhoneNumber   string
	Enabled       bool
	EmailVerified bool
}

type UserProfile struct {
	ID            string
	Email         string
	FullName      string
	PhoneNumber   string
	AvatarURL     string
	EmailVerified bool
	Enabled       bool
}

// ── internal representations ────────────────────────────────────────

type tokenResponse struct {
	AccessToken string `json:"access_token"`
	ExpiresIn   int64  `json:"expires_in"`
}

type userTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

type userRepresentation struct {
	ID            string                     `json:"id,omitempty"`
	Username      string                     `json:"username,omitempty"`
	Email         string                     `json:"email,omitempty"`
	FirstName     string                     `json:"firstName,omitempty"`
	LastName      string                     `json:"lastName,omitempty"`
	EmailVerified bool                       `json:"emailVerified,omitempty"`
	Enabled       bool                       `json:"enabled,omitempty"`
	Attributes    map[string][]string        `json:"attributes,omitempty"`
	Credentials   []credentialRepresentation `json:"credentials,omitempty"`
}

type credentialRepresentation struct {
	Type      string `json:"type"`
	Value     string `json:"value"`
	Temporary bool   `json:"temporary"`
}

// ── Client ──────────────────────────────────────────────────────────

type Client struct {
	baseURL          string
	realm            string
	clientID         string
	clientSecret     string
	userClientID     string // Client for user-facing ROPC auth
	userClientSecret string // Secret for user client
	httpClient       *http.Client

	mu             sync.Mutex
	accessToken    string
	accessTokenExp time.Time
	tokenFlight    singleflight.Group // H4 FIX: prevents thundering herd on admin token
}

func New(cfg AdminConfig, issuerURL string) (*Client, error) {
	baseURL := strings.TrimSpace(cfg.BaseURL)
	realm := strings.TrimSpace(cfg.Realm)
	if baseURL == "" || realm == "" {
		derivedBase, derivedRealm, err := deriveBaseURLAndRealm(issuerURL)
		if err != nil {
			return nil, err
		}
		if baseURL == "" {
			baseURL = derivedBase
		}
		if realm == "" {
			realm = derivedRealm
		}
	}
	clientID := strings.TrimSpace(cfg.ClientID)
	clientSecret := strings.TrimSpace(cfg.ClientSecret)
	if baseURL == "" || realm == "" || clientID == "" || clientSecret == "" {
		return nil, errors.New("incomplete keycloak admin configuration")
	}
	timeout := cfg.Timeout
	if timeout <= 0 {
		timeout = 5 * time.Second
	}
	return &Client{
		baseURL:      strings.TrimRight(baseURL, "/"),
		realm:        realm,
		clientID:     clientID,
		clientSecret: clientSecret,
		httpClient:   &http.Client{Timeout: timeout},
	}, nil
}

// SetUserClient sets the client ID and secret used for user-facing ROPC auth.
func (c *Client) SetUserClient(clientID, clientSecret string) {
	c.userClientID = strings.TrimSpace(clientID)
	c.userClientSecret = strings.TrimSpace(clientSecret)
}

// ── Admin token (client credentials) ────────────────────────────────

func (c *Client) adminAccessToken(ctx context.Context) (string, error) {
	// Fast path: return cached token if still fresh.
	c.mu.Lock()
	if c.accessToken != "" && time.Until(c.accessTokenExp) > 15*time.Second {
		token := c.accessToken
		c.mu.Unlock()
		return token, nil
	}
	c.mu.Unlock()

	// H4 FIX: singleflight prevents thundering herd — only one goroutine
	// fetches a new token, all others share the result.
	result, err, _ := c.tokenFlight.Do("admin_token", func() (interface{}, error) {
		form := url.Values{}
		form.Set("grant_type", "client_credentials")
		form.Set("client_id", c.clientID)
		form.Set("client_secret", c.clientSecret)

		req, err := http.NewRequestWithContext(ctx, http.MethodPost,
			fmt.Sprintf("%s/realms/%s/protocol/openid-connect/token", c.baseURL, url.PathEscape(c.realm)),
			strings.NewReader(form.Encode()),
		)
		if err != nil {
			return nil, err
		}
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		resp, err := c.httpClient.Do(req)
		if err != nil {
			return nil, fmt.Errorf("keycloak admin token request failed: connection error")
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			// H5 FIX: don't leak Keycloak response body
			return nil, fmt.Errorf("keycloak admin token request failed (status %d)", resp.StatusCode)
		}
		var tokenResp tokenResponse
		if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
			return nil, fmt.Errorf("keycloak admin token: invalid response")
		}

		c.mu.Lock()
		c.accessToken = tokenResp.AccessToken
		c.accessTokenExp = time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)
		c.mu.Unlock()
		return tokenResp.AccessToken, nil
	})
	if err != nil {
		return "", err
	}
	return result.(string), nil
}

// ── User CRUD ───────────────────────────────────────────────────────

func (c *Client) CreateUser(ctx context.Context, input CreateUserInput) (*UserProfile, error) {
	email := strings.ToLower(strings.TrimSpace(input.Email))
	password := strings.TrimSpace(input.Password)
	if email == "" || password == "" {
		return nil, errors.New("email and password are required")
	}
	token, err := c.adminAccessToken(ctx)
	if err != nil {
		return nil, err
	}
	firstName, lastName := splitFullName(strings.TrimSpace(input.FullName))
	payload := userRepresentation{
		Username:      email,
		Email:         email,
		FirstName:     firstName,
		LastName:      lastName,
		EmailVerified: input.EmailVerified,
		Enabled:       true,
		Credentials: []credentialRepresentation{
			{Type: "password", Value: password, Temporary: false},
		},
	}
	attrs := buildAttributes(strings.TrimSpace(input.FullName), strings.TrimSpace(input.PhoneNumber))
	if len(attrs) > 0 {
		payload.Attributes = attrs
	}
	body, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("%s/admin/realms/%s/users", c.baseURL, url.PathEscape(c.realm)),
		bytes.NewReader(body),
	)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	switch resp.StatusCode {
	case http.StatusCreated:
		location := strings.TrimSpace(resp.Header.Get("Location"))
		if uid := lastPathSegment(location); uid != "" {
			return c.GetUserByID(ctx, uid)
		}
		return c.FindUserByEmail(ctx, email)
	case http.StatusConflict:
		return nil, ErrUserAlreadyExists
	default:
		return nil, fmt.Errorf("create keycloak user failed with status %d", resp.StatusCode)
	}
}

func (c *Client) GetUserByID(ctx context.Context, keycloakUserID string) (*UserProfile, error) {
	keycloakUserID = strings.TrimSpace(keycloakUserID)
	if keycloakUserID == "" {
		return nil, errors.New("keycloak user id is required")
	}
	token, err := c.adminAccessToken(ctx)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		fmt.Sprintf("%s/admin/realms/%s/users/%s", c.baseURL, url.PathEscape(c.realm), url.PathEscape(keycloakUserID)), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrUserNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("keycloak user lookup failed with status %d", resp.StatusCode)
	}
	var user userRepresentation
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}
	return mapUserProfile(user), nil
}

func (c *Client) FindUserByEmail(ctx context.Context, email string) (*UserProfile, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return nil, errors.New("email is required")
	}
	token, err := c.adminAccessToken(ctx)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		fmt.Sprintf("%s/admin/realms/%s/users?email=%s&exact=true", c.baseURL, url.PathEscape(c.realm), url.QueryEscape(email)), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("keycloak user email lookup failed with status %d", resp.StatusCode)
	}
	var users []userRepresentation
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		return nil, err
	}
	for _, u := range users {
		if strings.EqualFold(strings.TrimSpace(u.Email), email) {
			return mapUserProfile(u), nil
		}
	}
	return nil, ErrUserNotFound
}

// ── User-facing auth (ROPC) ─────────────────────────────────────────

func (c *Client) Login(ctx context.Context, email, password string) (*TokenPair, error) {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" || strings.TrimSpace(password) == "" {
		return nil, errors.New("email and password are required")
	}
	// Use user client for ROPC login (includes sub claim in token)
	loginClientID := c.userClientID
	loginClientSecret := c.userClientSecret
	if loginClientID == "" {
		loginClientID = c.clientID
		loginClientSecret = c.clientSecret
	}
	form := url.Values{}
	form.Set("grant_type", "password")
	form.Set("client_id", loginClientID)
	if loginClientSecret != "" {
		form.Set("client_secret", loginClientSecret)
	}
	form.Set("username", email)
	form.Set("password", password)
	form.Set("scope", "openid")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("%s/realms/%s/protocol/openid-connect/token", c.baseURL, url.PathEscape(c.realm)),
		strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusUnauthorized {
		return nil, ErrInvalidCredentials
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("keycloak login failed with status %d", resp.StatusCode)
	}
	var t userTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&t); err != nil {
		return nil, err
	}
	return &TokenPair{AccessToken: t.AccessToken, RefreshToken: t.RefreshToken, ExpiresIn: t.ExpiresIn}, nil
}

func (c *Client) RefreshToken(ctx context.Context, refreshToken string) (*TokenPair, error) {
	if strings.TrimSpace(refreshToken) == "" {
		return nil, errors.New("refresh token is required")
	}
	refreshClientID := c.userClientID
	refreshClientSecret := c.userClientSecret
	if refreshClientID == "" {
		refreshClientID = c.clientID
		refreshClientSecret = c.clientSecret
	}
	form := url.Values{}
	form.Set("grant_type", "refresh_token")
	form.Set("client_id", refreshClientID)
	if refreshClientSecret != "" {
		form.Set("client_secret", refreshClientSecret)
	}
	form.Set("refresh_token", refreshToken)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("%s/realms/%s/protocol/openid-connect/token", c.baseURL, url.PathEscape(c.realm)),
		strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusUnauthorized {
		return nil, ErrInvalidCredentials
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("keycloak refresh failed with status %d", resp.StatusCode)
	}
	var t userTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&t); err != nil {
		return nil, err
	}
	return &TokenPair{AccessToken: t.AccessToken, RefreshToken: t.RefreshToken, ExpiresIn: t.ExpiresIn}, nil
}

func (c *Client) Logout(ctx context.Context, refreshToken string) error {
	if strings.TrimSpace(refreshToken) == "" {
		return errors.New("refresh token is required")
	}
	logoutClientID := c.userClientID
	logoutClientSecret := c.userClientSecret
	if logoutClientID == "" {
		logoutClientID = c.clientID
		logoutClientSecret = c.clientSecret
	}
	form := url.Values{}
	form.Set("client_id", logoutClientID)
	if logoutClientSecret != "" {
		form.Set("client_secret", logoutClientSecret)
	}
	form.Set("refresh_token", refreshToken)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("%s/realms/%s/protocol/openid-connect/logout", c.baseURL, url.PathEscape(c.realm)),
		strings.NewReader(form.Encode()))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNoContent || resp.StatusCode == http.StatusOK {
		return nil
	}
	return fmt.Errorf("keycloak logout failed with status %d", resp.StatusCode)
}

// ── Admin actions ───────────────────────────────────────────────────

func (c *Client) ExecuteActionsEmail(ctx context.Context, userID string, actions []string, opts *ActionEmailOptions) error {
	userID = strings.TrimSpace(userID)
	if userID == "" {
		return errors.New("user id is required")
	}
	token, err := c.adminAccessToken(ctx)
	if err != nil {
		return err
	}
	body, _ := json.Marshal(actions)
	requestURL := fmt.Sprintf("%s/admin/realms/%s/users/%s/execute-actions-email", c.baseURL, url.PathEscape(c.realm), url.PathEscape(userID))
	if opts != nil {
		params := url.Values{}
		if cid := strings.TrimSpace(opts.ClientID); cid != "" {
			params.Set("client_id", cid)
		}
		if ruri := strings.TrimSpace(opts.RedirectURI); ruri != "" {
			params.Set("redirect_uri", ruri)
		}
		if enc := params.Encode(); enc != "" {
			requestURL += "?" + enc
		}
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, requestURL, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNoContent || resp.StatusCode == http.StatusOK {
		return nil
	}
	return fmt.Errorf("execute actions email failed with status %d", resp.StatusCode)
}

func (c *Client) SendVerificationEmail(ctx context.Context, userID string, opts *ActionEmailOptions) error {
	return c.ExecuteActionsEmail(ctx, userID, []string{"VERIFY_EMAIL"}, opts)
}

func (c *Client) ResetPassword(ctx context.Context, keycloakUserID, newPassword string) error {
	keycloakUserID = strings.TrimSpace(keycloakUserID)
	newPassword = strings.TrimSpace(newPassword)
	if keycloakUserID == "" || newPassword == "" {
		return errors.New("keycloak user id and new password are required")
	}
	token, err := c.adminAccessToken(ctx)
	if err != nil {
		return err
	}
	payload, _ := json.Marshal(credentialRepresentation{Type: "password", Value: newPassword, Temporary: false})
	req, err := http.NewRequestWithContext(ctx, http.MethodPut,
		fmt.Sprintf("%s/admin/realms/%s/users/%s/reset-password", c.baseURL, url.PathEscape(c.realm), url.PathEscape(keycloakUserID)),
		bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusNoContent || resp.StatusCode == http.StatusOK {
		return nil
	}
	return fmt.Errorf("reset password failed with status %d", resp.StatusCode)
}

func (c *Client) LogoutAllSessions(ctx context.Context, keycloakUserID string) error {
	keycloakUserID = strings.TrimSpace(keycloakUserID)
	if keycloakUserID == "" {
		return errors.New("keycloak user ID is required")
	}
	token, err := c.adminAccessToken(ctx)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("%s/admin/realms/%s/users/%s/logout", c.baseURL, url.PathEscape(c.realm), url.PathEscape(keycloakUserID)), nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusNoContent && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("logout all sessions failed with status %d", resp.StatusCode)
	}
	return nil
}

// ── Social / OAuth2 ─────────────────────────────────────────────────

func (c *Client) GetSocialLoginURL(idpName, redirectURI, state string) string {
	params := url.Values{}
	params.Set("client_id", c.clientID)
	params.Set("response_type", "code")
	params.Set("scope", "openid profile email")
	params.Set("redirect_uri", redirectURI)
	params.Set("state", state)
	if idpName != "" {
		params.Set("kc_idp_hint", idpName)
	}
	return fmt.Sprintf("%s/realms/%s/protocol/openid-connect/auth?%s",
		c.baseURL, url.PathEscape(c.realm), params.Encode())
}

func (c *Client) ExchangeCodeForToken(ctx context.Context, code, redirectURI string) (*TokenPair, error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return nil, errors.New("authorization code is required")
	}
	form := url.Values{}
	form.Set("grant_type", "authorization_code")
	form.Set("client_id", c.clientID)
	form.Set("client_secret", c.clientSecret)
	form.Set("code", code)
	form.Set("redirect_uri", redirectURI)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("%s/realms/%s/protocol/openid-connect/token", c.baseURL, url.PathEscape(c.realm)),
		strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusBadRequest {
		return nil, ErrInvalidCredentials
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("keycloak code exchange failed with status %d", resp.StatusCode)
	}
	var t userTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&t); err != nil {
		return nil, err
	}
	return &TokenPair{AccessToken: t.AccessToken, RefreshToken: t.RefreshToken, ExpiresIn: t.ExpiresIn}, nil
}

// ── Token Exchange (Impersonation) ──────────────────────────────────

func (c *Client) ImpersonateUser(ctx context.Context, adminToken string, targetKeycloakUserID string) (*TokenPair, error) {
	if strings.TrimSpace(adminToken) == "" || strings.TrimSpace(targetKeycloakUserID) == "" {
		return nil, errors.New("admin token and target user ID are required")
	}
	form := url.Values{}
	form.Set("grant_type", "urn:ietf:params:oauth:grant-type:token-exchange")
	form.Set("client_id", c.clientID)
	form.Set("client_secret", c.clientSecret)
	form.Set("requested_subject", targetKeycloakUserID)
	form.Set("subject_token", adminToken)
	form.Set("subject_token_type", "urn:ietf:params:oauth:token-type:access_token")
	req, err := http.NewRequestWithContext(ctx, http.MethodPost,
		fmt.Sprintf("%s/realms/%s/protocol/openid-connect/token", c.baseURL, url.PathEscape(c.realm)),
		strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		// H5 FIX: don't leak Keycloak response body to callers
		_, _ = io.ReadAll(resp.Body) // drain body
		return nil, fmt.Errorf("token exchange failed (status %d)", resp.StatusCode)
	}
	var t userTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&t); err != nil {
		return nil, err
	}
	return &TokenPair{AccessToken: t.AccessToken, RefreshToken: t.RefreshToken, ExpiresIn: t.ExpiresIn}, nil
}

// ── helpers ─────────────────────────────────────────────────────────

func deriveBaseURLAndRealm(issuerURL string) (string, string, error) {
	issuerURL = strings.TrimRight(strings.TrimSpace(issuerURL), "/")
	if issuerURL == "" {
		return "", "", errors.New("issuer url is required")
	}
	idx := strings.LastIndex(issuerURL, "/realms/")
	if idx < 0 {
		return "", "", fmt.Errorf("issuer url %s does not contain /realms/", issuerURL)
	}
	return issuerURL[:idx], issuerURL[idx+len("/realms/"):], nil
}

func mapUserProfile(u userRepresentation) *UserProfile {
	fullName := firstAttr(u.Attributes, "full_name")
	if fullName == "" {
		fullName = strings.TrimSpace(u.FirstName + " " + u.LastName)
	}
	avatarURL := firstAttr(u.Attributes, "picture")
	if avatarURL == "" {
		avatarURL = firstAttr(u.Attributes, "avatar_url")
	}
	return &UserProfile{
		ID:            strings.TrimSpace(u.ID),
		Email:         strings.ToLower(strings.TrimSpace(u.Email)),
		FullName:      fullName,
		PhoneNumber:   firstAttr(u.Attributes, "phone_number"),
		AvatarURL:     avatarURL,
		EmailVerified: u.EmailVerified,
		Enabled:       u.Enabled,
	}
}

func buildAttributes(fullName, phoneNumber string) map[string][]string {
	attrs := map[string][]string{}
	if fullName != "" {
		attrs["full_name"] = []string{fullName}
	}
	if phoneNumber != "" {
		attrs["phone_number"] = []string{phoneNumber}
	}
	if len(attrs) == 0 {
		return nil
	}
	return attrs
}

func firstAttr(attrs map[string][]string, key string) string {
	if vals := attrs[key]; len(vals) > 0 {
		return strings.TrimSpace(vals[0])
	}
	return ""
}

func splitFullName(name string) (string, string) {
	parts := strings.Fields(name)
	switch len(parts) {
	case 0:
		return "", ""
	case 1:
		return parts[0], ""
	default:
		return parts[0], strings.Join(parts[1:], " ")
	}
}

func lastPathSegment(value string) string {
	value = strings.TrimRight(strings.TrimSpace(value), "/")
	if idx := strings.LastIndexByte(value, '/'); idx >= 0 && idx < len(value)-1 {
		return value[idx+1:]
	}
	return value
}

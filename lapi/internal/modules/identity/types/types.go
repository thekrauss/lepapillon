package types

// NoBody is used for tonic handlers that take no request body.
type NoBody struct{}

// ── Register ────────────────────────────────────────────────────────

type RegisterRequest struct {
	Email       string `json:"email" validate:"required,email"`
	Password    string `json:"password" validate:"required,min=8"`
	FullName    string `json:"full_name" validate:"required,min=2"`
	PhoneNumber string `json:"phone_number"`
}

type RegisterResponse struct {
	KeycloakUserID string `json:"keycloak_user_id"`
	Email          string `json:"email"`
}

// ── Login ───────────────────────────────────────────────────────────

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type LoginResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

// ── Refresh ─────────────────────────────────────────────────────────

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type RefreshTokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

// ── Logout ──────────────────────────────────────────────────────────

type LogoutRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
	AccessToken  string `json:"access_token,omitempty"`
}

type LogoutResponse struct{}

// ── Forgot Password ─────────────────────────────────────────────────

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ForgotPasswordResponse struct {
	Message string `json:"message"`
}

// ── Change Password ─────────────────────────────────────────────────

type ChangePasswordRequest struct {
	NewPassword string `json:"new_password" validate:"required,min=8"`
}

// ── Social Login ────────────────────────────────────────────────────

type SocialLoginURLPath struct {
	Provider string `path:"provider"`
}

type SocialLoginURLQuery struct {
	RedirectURI string `query:"redirect_uri" validate:"required"`
	State       string `query:"state"`
}

type SocialLoginURLInput struct {
	SocialLoginURLPath
	SocialLoginURLQuery
}

type SocialLoginURLResponse struct {
	URL      string `json:"url"`
	Provider string `json:"provider"`
}

type SocialCallbackRequest struct {
	Code        string `json:"code" validate:"required"`
	State       string `json:"state"`
	RedirectURI string `json:"redirect_uri" validate:"required"`
}

// ── Error ───────────────────────────────────────────────────────────

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

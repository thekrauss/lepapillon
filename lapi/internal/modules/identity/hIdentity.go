package identity

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/thekrauss/lepapillon/internal/cache"
	"github.com/thekrauss/lepapillon/internal/infras/middleware"
	identitysvc "github.com/thekrauss/lepapillon/internal/modules/identity/services"
	identitytypes "github.com/thekrauss/lepapillon/internal/modules/identity/types"
)

// Controller — tonic-style signatures following gophercart pattern.
type Controller interface {
	Register(c *gin.Context, in *identitytypes.RegisterRequest) (*identitytypes.RegisterResponse, error)

	Login(ctx context.Context, req identitytypes.LoginRequest) (*identitytypes.LoginResponse, error)
	Logout(ctx context.Context, req identitytypes.LogoutRequest) (*identitytypes.LogoutResponse, error)
	RefreshToken(ctx context.Context, req identitytypes.RefreshTokenRequest) (*identitytypes.RefreshTokenResponse, error)

	ForgotPassword(ctx context.Context, req identitytypes.ForgotPasswordRequest) error
	ChangePassword(ctx context.Context, req identitytypes.ChangePasswordRequest) error

	SocialLoginURL(ctx context.Context, provider, redirectURI string) (*identitytypes.SocialLoginURLResponse, error)
	SocialCallback(ctx context.Context, req identitytypes.SocialCallbackRequest) (*identitytypes.LoginResponse, error)

	ResendVerificationEmail(ctx context.Context) error
}

type controller struct {
	service   identitysvc.Service
	cacheRepo cache.AuthCache
}

func NewController(service identitysvc.Service, cacheRepo cache.AuthCache) Controller {
	return &controller{service: service, cacheRepo: cacheRepo}
}

//  Register (tonic-style: gin.Context + input)

func (ctrl *controller) Register(c *gin.Context, in *identitytypes.RegisterRequest) (*identitytypes.RegisterResponse, error) {
	if ctrl.service == nil {
		return nil, errServiceUnavailable
	}
	if in == nil {
		return nil, errors.New("input is required")
	}
	resp, err := ctrl.service.Register(c.Request.Context(), identitysvc.RegisterRequest{
		Email:       in.Email,
		Password:    in.Password,
		FullName:    in.FullName,
		PhoneNumber: in.PhoneNumber,
	})
	if err != nil {
		return nil, err
	}
	return &identitytypes.RegisterResponse{
		KeycloakUserID: resp.KeycloakUserID,
		Email:          resp.Email,
	}, nil
}

//  Login (context-style)

func (ctrl *controller) Login(ctx context.Context, req identitytypes.LoginRequest) (*identitytypes.LoginResponse, error) {
	if ctrl.service == nil {
		return nil, errServiceUnavailable
	}
	result, err := ctrl.service.Login(ctx, identitysvc.LoginRequest{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		return nil, err
	}
	return &identitytypes.LoginResponse{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		ExpiresIn:    result.ExpiresIn,
	}, nil
}

//  Logout

func (ctrl *controller) Logout(ctx context.Context, req identitytypes.LogoutRequest) (*identitytypes.LogoutResponse, error) {
	if ctrl.service == nil {
		return nil, errServiceUnavailable
	}
	if err := ctrl.service.Logout(ctx, req.RefreshToken); err != nil {
		return nil, err
	}
	if ctrl.cacheRepo != nil && req.AccessToken != "" {
		if jti := extractJTI(req.AccessToken); jti != "" {
			_ = ctrl.cacheRepo.BlacklistAccessTokenJTI(ctx, jti, 24*time.Hour)
		}
	}
	return &identitytypes.LogoutResponse{}, nil
}

//  Refresh

func (ctrl *controller) RefreshToken(ctx context.Context, req identitytypes.RefreshTokenRequest) (*identitytypes.RefreshTokenResponse, error) {
	if ctrl.service == nil {
		return nil, errServiceUnavailable
	}
	result, err := ctrl.service.RefreshToken(ctx, req.RefreshToken)
	if err != nil {
		return nil, err
	}
	return &identitytypes.RefreshTokenResponse{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		ExpiresIn:    result.ExpiresIn,
	}, nil
}

//  Forgot Password

func (ctrl *controller) ForgotPassword(ctx context.Context, req identitytypes.ForgotPasswordRequest) error {
	if ctrl.service == nil {
		return errServiceUnavailable
	}
	return ctrl.service.ForgotPassword(ctx, req.Email)
}

//  Change Password

func (ctrl *controller) ChangePassword(ctx context.Context, req identitytypes.ChangePasswordRequest) error {
	if ctrl.service == nil {
		return errServiceUnavailable
	}
	keycloakUserID, ok := middleware.UserIDFromContext(ctx)
	if !ok || keycloakUserID == "" {
		return errors.New("authenticated user context missing")
	}
	return ctrl.service.ChangePassword(ctx, keycloakUserID, req.NewPassword)
}

//  Social Login

func (ctrl *controller) SocialLoginURL(ctx context.Context, provider, redirectURI string) (*identitytypes.SocialLoginURLResponse, error) {
	if ctrl.service == nil {
		return nil, errServiceUnavailable
	}
	url, err := ctrl.service.SocialLoginURL(provider, redirectURI, "")
	if err != nil {
		return nil, err
	}
	return &identitytypes.SocialLoginURLResponse{URL: url, Provider: provider}, nil
}

func (ctrl *controller) SocialCallback(ctx context.Context, req identitytypes.SocialCallbackRequest) (*identitytypes.LoginResponse, error) {
	if ctrl.service == nil {
		return nil, errServiceUnavailable
	}
	result, err := ctrl.service.SocialCallback(ctx, req.Code, req.State, req.RedirectURI)
	if err != nil {
		return nil, err
	}
	return &identitytypes.LoginResponse{
		AccessToken:  result.AccessToken,
		RefreshToken: result.RefreshToken,
		ExpiresIn:    result.ExpiresIn,
	}, nil
}

//  Resend Verification

func (ctrl *controller) ResendVerificationEmail(ctx context.Context) error {
	if ctrl.service == nil {
		return errServiceUnavailable
	}
	keycloakUserID, ok := middleware.UserIDFromContext(ctx)
	if !ok || keycloakUserID == "" {
		return errors.New("authenticated user context missing")
	}
	return ctrl.service.ResendVerificationEmail(ctx, keycloakUserID)
}

//  helpers

var errServiceUnavailable = errors.New("identity service unavailable")

func extractJTI(tokenString string) string {
	tokenString = strings.TrimPrefix(strings.TrimSpace(tokenString), "Bearer ")
	parts := strings.SplitN(tokenString, ".", 3)
	if len(parts) != 3 {
		return ""
	}
	seg := parts[1]
	if rem := len(seg) % 4; rem != 0 {
		seg += strings.Repeat("=", 4-rem)
	}
	decoded, err := base64.URLEncoding.DecodeString(seg)
	if err != nil {
		return ""
	}
	var claims struct {
		JTI string `json:"jti"`
	}
	if err := json.Unmarshal(decoded, &claims); err != nil {
		return ""
	}
	return strings.TrimSpace(claims.JTI)
}

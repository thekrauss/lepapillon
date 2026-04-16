package auth

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/thekrauss/lepapillon/internal/infras/middleware"
	authsvc "github.com/thekrauss/lepapillon/internal/modules/auth/service"
	"github.com/thekrauss/lepapillon/internal/modules/auth/types"
)

// IAuthController — tonic-style signatures: (c, *Input) → (*Output, error).
// Tonic handles JSON binding, validation and error serialization.
type IAuthController interface {
	GetProfile(c *gin.Context, in *types.NoBody) (*types.ProfileResponse, error)
	UpdateProfile(c *gin.Context, in *types.UpdateProfileRequest) (*types.ProfileResponse, error)
	ListAddresses(c *gin.Context, in *types.NoBody) ([]types.AddressResponse, error)
	CreateAddress(c *gin.Context, in *types.CreateAddressRequest) (*types.AddressResponse, error)
	UpdateAddress(c *gin.Context, in *types.UpdateAddressInput) (*types.AddressResponse, error)
	DeleteAddress(c *gin.Context, in *types.DeleteAddressInput) error
}

type AuthController struct {
	service *authsvc.AuthService
}

func NewAuthController(svc *authsvc.AuthService) IAuthController {
	return &AuthController{service: svc}
}

// ── Profile ─────────────────────────────────────────────────────────

func (ctrl *AuthController) GetProfile(c *gin.Context, _ *types.NoBody) (*types.ProfileResponse, error) {
	userID, err := userIDFromCtx(c)
	if err != nil {
		return nil, err
	}

	profile, err := ctrl.service.GetProfile(c.Request.Context(), userID)
	if err != nil {
		return nil, err
	}

	return mapProfileToTypes(profile), nil
}

func (ctrl *AuthController) UpdateProfile(c *gin.Context, in *types.UpdateProfileRequest) (*types.ProfileResponse, error) {
	userID, err := userIDFromCtx(c)
	if err != nil {
		return nil, err
	}

	req := authsvc.UpdateProfileRequest{
		FirstName: in.FirstName,
		LastName:  in.LastName,
		Phone:     in.Phone,
	}

	profile, err := ctrl.service.UpdateProfile(c.Request.Context(), userID, req)
	if err != nil {
		return nil, err
	}

	return mapProfileToTypes(profile), nil
}

// ── Addresses ───────────────────────────────────────────────────────

func (ctrl *AuthController) ListAddresses(c *gin.Context, _ *types.NoBody) ([]types.AddressResponse, error) {
	userID, err := userIDFromCtx(c)
	if err != nil {
		return nil, err
	}

	profile, err := ctrl.service.GetProfile(c.Request.Context(), userID)
	if err != nil {
		return nil, err
	}

	out := make([]types.AddressResponse, 0, len(profile.Addresses))
	for _, a := range profile.Addresses {
		out = append(out, types.AddressResponse{
			ID:         a.ID,
			Label:      a.Label,
			Street:     a.Street,
			City:       a.City,
			PostalCode: a.PostalCode,
			IsDefault:  a.IsDefault,
		})
	}
	return out, nil
}

func (ctrl *AuthController) CreateAddress(c *gin.Context, in *types.CreateAddressRequest) (*types.AddressResponse, error) {
	userID, err := userIDFromCtx(c)
	if err != nil {
		return nil, err
	}

	req := authsvc.CreateAddressRequest{
		Label:      in.Label,
		Street:     in.Street,
		City:       in.City,
		PostalCode: in.PostalCode,
		IsDefault:  in.IsDefault,
	}

	resp, err := ctrl.service.CreateAddress(c.Request.Context(), userID, req)
	if err != nil {
		return nil, err
	}

	return &types.AddressResponse{
		ID:         resp.ID,
		Label:      resp.Label,
		Street:     resp.Street,
		City:       resp.City,
		PostalCode: resp.PostalCode,
		IsDefault:  resp.IsDefault,
	}, nil
}

func (ctrl *AuthController) UpdateAddress(c *gin.Context, in *types.UpdateAddressInput) (*types.AddressResponse, error) {
	userID, err := userIDFromCtx(c)
	if err != nil {
		return nil, err
	}

	req := authsvc.UpdateAddressRequest{
		Label:      in.Label,
		Street:     in.Street,
		City:       in.City,
		PostalCode: in.PostalCode,
		IsDefault:  in.IsDefault,
	}

	resp, err := ctrl.service.UpdateAddress(c.Request.Context(), userID, in.AddressID, req)
	if err != nil {
		return nil, err
	}

	return &types.AddressResponse{
		ID:         resp.ID,
		Label:      resp.Label,
		Street:     resp.Street,
		City:       resp.City,
		PostalCode: resp.PostalCode,
		IsDefault:  resp.IsDefault,
	}, nil
}

func (ctrl *AuthController) DeleteAddress(c *gin.Context, in *types.DeleteAddressInput) error {
	userID, err := userIDFromCtx(c)
	if err != nil {
		return err
	}

	return ctrl.service.DeleteAddress(c.Request.Context(), userID, in.AddressID)
}

// ── helpers ─────────────────────────────────────────────────────────

func userIDFromCtx(c *gin.Context) (uuid.UUID, error) {
	// Try internal user ID first (set by UserSync middleware)
	if raw, ok := middleware.InternalUserIDFromContext(c.Request.Context()); ok && raw != "" {
		return uuid.Parse(raw)
	}

	// Fallback: user_id from Gin context (set by auth middleware)
	raw, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, errors.New("user context missing")
	}
	switch v := raw.(type) {
	case string:
		return uuid.Parse(v)
	case uuid.UUID:
		return v, nil
	default:
		return uuid.Nil, errors.New("invalid user context")
	}
}

func mapProfileToTypes(p *authsvc.ProfileResponse) *types.ProfileResponse {
	addresses := make([]types.AddressResponse, 0, len(p.Addresses))
	for _, a := range p.Addresses {
		addresses = append(addresses, types.AddressResponse{
			ID:         a.ID,
			Label:      a.Label,
			Street:     a.Street,
			City:       a.City,
			PostalCode: a.PostalCode,
			IsDefault:  a.IsDefault,
		})
	}
	return &types.ProfileResponse{
		ID:        p.ID,
		Email:     p.Email,
		FirstName: p.FirstName,
		LastName:  p.LastName,
		Phone:     p.Phone,
		Role:      p.Role,
		Addresses: addresses,
	}
}

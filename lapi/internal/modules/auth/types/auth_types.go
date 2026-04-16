package types

import "github.com/google/uuid"

// NoBody is used for tonic handlers that take no request body.
type NoBody struct{}

// ── Path params ─────────────────────────────────────────────────────

type AddressIDPath struct {
	AddressID uuid.UUID `path:"id"`
}

// ── Profile ─────────────────────────────────────────────────────────

type UpdateProfileRequest struct {
	FirstName *string `json:"first_name,omitempty" validate:"omitempty,min=2,max=100"`
	LastName  *string `json:"last_name,omitempty" validate:"omitempty,min=2,max=100"`
	Phone     *string `json:"phone,omitempty" validate:"omitempty,max=20"`
}

type ProfileResponse struct {
	ID             uuid.UUID         `json:"id"`
	KeycloakUserID string            `json:"keycloak_user_id,omitempty"`
	Email          string            `json:"email"`
	FirstName      string            `json:"first_name"`
	LastName       string            `json:"last_name"`
	Phone          string            `json:"phone"`
	Role           string            `json:"role"`
	Addresses      []AddressResponse `json:"addresses"`
}

// ── Address ─────────────────────────────────────────────────────────

type CreateAddressRequest struct {
	Label      string `json:"label" validate:"max=50"`
	Street     string `json:"street" validate:"required,max=255"`
	City       string `json:"city" validate:"required,max=100"`
	PostalCode string `json:"postal_code" validate:"required,max=10"`
	IsDefault  bool   `json:"is_default"`
}

// UpdateAddressInput combines path param + body for tonic binding.
type UpdateAddressInput struct {
	AddressIDPath
	UpdateAddressRequest
}

type UpdateAddressRequest struct {
	Label      *string `json:"label,omitempty" validate:"omitempty,max=50"`
	Street     *string `json:"street,omitempty" validate:"omitempty,max=255"`
	City       *string `json:"city,omitempty" validate:"omitempty,max=100"`
	PostalCode *string `json:"postal_code,omitempty" validate:"omitempty,max=10"`
	IsDefault  *bool   `json:"is_default,omitempty"`
}

// DeleteAddressInput is path-only for tonic binding.
type DeleteAddressInput struct {
	AddressIDPath
}

type AddressResponse struct {
	ID         uuid.UUID `json:"id"`
	Label      string    `json:"label"`
	Street     string    `json:"street"`
	City       string    `json:"city"`
	PostalCode string    `json:"postal_code"`
	IsDefault  bool      `json:"is_default"`
}

type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message"`
}

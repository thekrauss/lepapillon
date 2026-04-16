package service

import "github.com/google/uuid"

// ── Register ────────────────────────────────────────────────────────

type RegisterRequest struct {
	Email     string `json:"email" validate:"required,email"`
	Password  string `json:"password" validate:"required,min=8"`
	FirstName string `json:"first_name" validate:"required,min=2"`
	LastName  string `json:"last_name" validate:"required,min=2"`
	Phone     string `json:"phone,omitempty"`
}

type RegisterResponse struct {
	UserID uuid.UUID `json:"user_id"`
}

// ── Login ───────────────────────────────────────────────────────────

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

// ── Refresh ─────────────────────────────────────────────────────────

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// ── Profile ─────────────────────────────────────────────────────────

type ProfileResponse struct {
	ID        uuid.UUID         `json:"id"`
	Email     string            `json:"email"`
	FirstName string            `json:"first_name"`
	LastName  string            `json:"last_name"`
	Phone     string            `json:"phone"`
	Role      string            `json:"role"`
	Addresses []AddressResponse `json:"addresses"`
}

type UpdateProfileRequest struct {
	FirstName *string `json:"first_name,omitempty" validate:"omitempty,min=2"`
	LastName  *string `json:"last_name,omitempty" validate:"omitempty,min=2"`
	Phone     *string `json:"phone,omitempty"`
}

// ── Address ─────────────────────────────────────────────────────────

type CreateAddressRequest struct {
	Label      string `json:"label,omitempty"`
	Street     string `json:"street" validate:"required"`
	City       string `json:"city" validate:"required"`
	PostalCode string `json:"postal_code" validate:"required"`
	IsDefault  bool   `json:"is_default"`
}

type UpdateAddressRequest struct {
	Label      *string `json:"label,omitempty"`
	Street     *string `json:"street,omitempty"`
	City       *string `json:"city,omitempty"`
	PostalCode *string `json:"postal_code,omitempty"`
	IsDefault  *bool   `json:"is_default,omitempty"`
}

type AddressResponse struct {
	ID         uuid.UUID `json:"id"`
	Label      string    `json:"label"`
	Street     string    `json:"street"`
	City       string    `json:"city"`
	PostalCode string    `json:"postal_code"`
	IsDefault  bool      `json:"is_default"`
}

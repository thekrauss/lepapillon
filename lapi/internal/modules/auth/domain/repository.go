package domain

import (
	"context"

	"github.com/google/uuid"
)

type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id uuid.UUID) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByKeycloakID(ctx context.Context, keycloakUserID string) (*User, error)
	Update(ctx context.Context, user *User) error
	ExistsByEmail(ctx context.Context, email string) (bool, error)
}

type AddressRepository interface {
	Create(ctx context.Context, address *Address) error
	GetByID(ctx context.Context, id uuid.UUID) (*Address, error)
	ListByUserID(ctx context.Context, userID uuid.UUID) ([]Address, error)
	Update(ctx context.Context, address *Address) error
	Delete(ctx context.Context, id uuid.UUID) error
	ClearDefaults(ctx context.Context, userID uuid.UUID) error
}

type RefreshTokenRepository interface {
	Create(ctx context.Context, token *RefreshToken) error
	GetByTokenHash(ctx context.Context, hash string) (*RefreshToken, error)
	DeleteByTokenHash(ctx context.Context, hash string) error
	DeleteAllByUserID(ctx context.Context, userID uuid.UUID) error
	// ConsumeByTokenHash atomically deletes and returns the token.
	// Returns ErrNotFound if already consumed by a concurrent request.
	ConsumeByTokenHash(ctx context.Context, hash string) (*RefreshToken, error)
}

// AddressTransactor wraps address operations in a DB transaction.
type AddressTransactor interface {
	CreateAddressAtomic(ctx context.Context, userID uuid.UUID, addr *Address) error
	UpdateAddressAtomic(ctx context.Context, userID uuid.UUID, addr *Address) error
}

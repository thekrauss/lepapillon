package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/thekrauss/lepapillon/internal/core/domain"
	authdomain "github.com/thekrauss/lepapillon/internal/modules/auth/domain"
	"gorm.io/gorm"
)

type GormRefreshTokenRepository struct {
	db *gorm.DB
}

func NewGormRefreshTokenRepository(db *gorm.DB) authdomain.RefreshTokenRepository {
	return &GormRefreshTokenRepository{db: db}
}

func (r *GormRefreshTokenRepository) Create(ctx context.Context, token *authdomain.RefreshToken) error {
	return r.db.WithContext(ctx).Create(token).Error
}

func (r *GormRefreshTokenRepository) GetByTokenHash(ctx context.Context, hash string) (*authdomain.RefreshToken, error) {
	var token authdomain.RefreshToken
	if err := r.db.WithContext(ctx).Where("token_hash = ?", hash).First(&token).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &token, nil
}

func (r *GormRefreshTokenRepository) DeleteByTokenHash(ctx context.Context, hash string) error {
	return r.db.WithContext(ctx).Where("token_hash = ?", hash).Delete(&authdomain.RefreshToken{}).Error
}

func (r *GormRefreshTokenRepository) DeleteAllByUserID(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).Where("user_id = ?", userID).Delete(&authdomain.RefreshToken{}).Error
}

// ConsumeByTokenHash atomically deletes and returns the token in a single
// SQL statement (DELETE ... RETURNING). If 0 rows affected, returns ErrNotFound
// so concurrent callers are rejected.
func (r *GormRefreshTokenRepository) ConsumeByTokenHash(ctx context.Context, hash string) (*authdomain.RefreshToken, error) {
	var token authdomain.RefreshToken
	result := r.db.WithContext(ctx).
		Raw("DELETE FROM refresh_tokens WHERE token_hash = ? RETURNING *", hash).
		Scan(&token)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, domain.ErrNotFound
	}
	return &token, nil
}

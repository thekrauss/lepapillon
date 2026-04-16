package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/thekrauss/lepapillon/internal/core/domain"
	authdomain "github.com/thekrauss/lepapillon/internal/modules/auth/domain"
	"gorm.io/gorm"
)

type GormUserRepository struct {
	db *gorm.DB
}

func NewGormUserRepository(db *gorm.DB) authdomain.UserRepository {
	return &GormUserRepository{db: db}
}

func (r *GormUserRepository) Create(ctx context.Context, user *authdomain.User) error {
	if err := r.db.WithContext(ctx).Create(user).Error; err != nil {
		return err
	}
	return nil
}

func (r *GormUserRepository) GetByID(ctx context.Context, id uuid.UUID) (*authdomain.User, error) {
	var user authdomain.User
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *GormUserRepository) GetByEmail(ctx context.Context, email string) (*authdomain.User, error) {
	var user authdomain.User
	if err := r.db.WithContext(ctx).Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *GormUserRepository) GetByKeycloakID(ctx context.Context, keycloakUserID string) (*authdomain.User, error) {
	var user authdomain.User
	if err := r.db.WithContext(ctx).Where("keycloak_user_id = ?", keycloakUserID).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &user, nil
}

func (r *GormUserRepository) Update(ctx context.Context, user *authdomain.User) error {
	return r.db.WithContext(ctx).Save(user).Error
}

func (r *GormUserRepository) ExistsByEmail(ctx context.Context, email string) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).Model(&authdomain.User{}).Where("email = ?", email).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

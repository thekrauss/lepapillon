package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/thekrauss/lepapillon/internal/core/domain"
	authdomain "github.com/thekrauss/lepapillon/internal/modules/auth/domain"
	"gorm.io/gorm"
)

type GormAddressRepository struct {
	db *gorm.DB
}

func NewGormAddressRepository(db *gorm.DB) authdomain.AddressRepository {
	return &GormAddressRepository{db: db}
}

func (r *GormAddressRepository) Create(ctx context.Context, address *authdomain.Address) error {
	return r.db.WithContext(ctx).Create(address).Error
}

func (r *GormAddressRepository) GetByID(ctx context.Context, id uuid.UUID) (*authdomain.Address, error) {
	var address authdomain.Address
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&address).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &address, nil
}

func (r *GormAddressRepository) ListByUserID(ctx context.Context, userID uuid.UUID) ([]authdomain.Address, error) {
	var addresses []authdomain.Address
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("is_default DESC, created_at ASC").Find(&addresses).Error; err != nil {
		return nil, err
	}
	return addresses, nil
}

func (r *GormAddressRepository) Update(ctx context.Context, address *authdomain.Address) error {
	return r.db.WithContext(ctx).Save(address).Error
}

func (r *GormAddressRepository) Delete(ctx context.Context, id uuid.UUID) error {
	result := r.db.WithContext(ctx).Where("id = ?", id).Delete(&authdomain.Address{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *GormAddressRepository) ClearDefaults(ctx context.Context, userID uuid.UUID) error {
	return r.db.WithContext(ctx).
		Model(&authdomain.Address{}).
		Where("user_id = ? AND is_default = ?", userID, true).
		Update("is_default", false).Error
}

package repository

import (
	"context"
	"errors"

	"github.com/google/uuid"
	coredomain "github.com/thekrauss/lepapillon/internal/core/domain"
	"github.com/thekrauss/lepapillon/internal/modules/checkout/domain"
	"gorm.io/gorm"
)

type CheckoutRepository interface {
	CreateOrder(ctx context.Context, order *domain.Order) error
	GetOrderByID(ctx context.Context, id uuid.UUID) (*domain.Order, error)
	ListOrdersByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Order, int64, error)
	UpdateOrderStatus(ctx context.Context, id uuid.UUID, status string) error
	SetStripePaymentIntentID(ctx context.Context, id uuid.UUID, intentID string) error
}

type checkoutRepository struct {
	db *gorm.DB
}

func NewCheckoutRepository(db *gorm.DB) CheckoutRepository {
	return &checkoutRepository{db: db}
}

func (r *checkoutRepository) CreateOrder(ctx context.Context, order *domain.Order) error {
	return r.db.WithContext(ctx).Create(order).Error
}

func (r *checkoutRepository) GetOrderByID(ctx context.Context, id uuid.UUID) (*domain.Order, error) {
	var order domain.Order
	err := r.db.WithContext(ctx).
		Preload("Items").
		Preload("Prestation").
		First(&order, "id = ?", id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, coredomain.ErrNotFound
		}
		return nil, err
	}
	return &order, nil
}

func (r *checkoutRepository) ListOrdersByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]domain.Order, int64, error) {
	var orders []domain.Order
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.Order{}).Where("user_id = ?", userID)
	q.Count(&total)

	if limit <= 0 || limit > 50 {
		limit = 20
	}
	err := q.Preload("Items").Preload("Prestation").
		Order("created_at DESC").Limit(limit).Offset(offset).
		Find(&orders).Error
	return orders, total, err
}

func (r *checkoutRepository) UpdateOrderStatus(ctx context.Context, id uuid.UUID, status string) error {
	return r.db.WithContext(ctx).Model(&domain.Order{}).Where("id = ?", id).Update("status", status).Error
}

func (r *checkoutRepository) SetStripePaymentIntentID(ctx context.Context, id uuid.UUID, intentID string) error {
	return r.db.WithContext(ctx).Model(&domain.Order{}).Where("id = ?", id).Update("stripe_payment_intent_id", intentID).Error
}

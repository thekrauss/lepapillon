package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/thekrauss/lepapillon/internal/modules/panier/domain"
)

const (
	cartKeyPrefix = "cart:"
	cartTTL       = 30 * 24 * time.Hour // 30 days
)

// PanierRepository handles cart persistence in Redis.
type PanierRepository interface {
	GetCart(ctx context.Context, userID string) (*domain.Cart, error)
	SaveCart(ctx context.Context, cart *domain.Cart) error
	DeleteCart(ctx context.Context, userID string) error
}

type redisPanierRepository struct {
	client *redis.Client
}

func NewRedisPanierRepository(client *redis.Client) PanierRepository {
	return &redisPanierRepository{client: client}
}

func cartKey(userID string) string {
	return fmt.Sprintf("%s%s", cartKeyPrefix, userID)
}

func (r *redisPanierRepository) GetCart(ctx context.Context, userID string) (*domain.Cart, error) {
	data, err := r.client.Get(ctx, cartKey(userID)).Bytes()
	if err != nil {
		if err == redis.Nil {
			// Return empty cart
			return &domain.Cart{
				UserID:    userID,
				Items:     []domain.CartItem{},
				UpdatedAt: time.Now(),
			}, nil
		}
		return nil, fmt.Errorf("redis get cart: %w", err)
	}

	var cart domain.Cart
	if err := json.Unmarshal(data, &cart); err != nil {
		return nil, fmt.Errorf("unmarshal cart: %w", err)
	}
	cart.UserID = userID
	return &cart, nil
}

func (r *redisPanierRepository) SaveCart(ctx context.Context, cart *domain.Cart) error {
	cart.UpdatedAt = time.Now()
	data, err := json.Marshal(cart)
	if err != nil {
		return fmt.Errorf("marshal cart: %w", err)
	}
	return r.client.Set(ctx, cartKey(cart.UserID), data, cartTTL).Err()
}

func (r *redisPanierRepository) DeleteCart(ctx context.Context, userID string) error {
	return r.client.Del(ctx, cartKey(userID)).Err()
}

package repository

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentEvent struct {
	ID            uuid.UUID       `gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Provider      string          `gorm:"size:20;not null"`
	EventType     string          `gorm:"size:100;not null"`
	EventID       string          `gorm:"size:255"`
	IntentID      string          `gorm:"size:255"`
	RefundID      string          `gorm:"size:255"`
	OrderID       *uuid.UUID      `gorm:"type:uuid"`
	PaymentStatus string          `gorm:"size:20;not null"`
	Payload       json.RawMessage `gorm:"type:jsonb;not null"`
	ProcessedAt   *time.Time
	CreatedAt     time.Time
}

func (PaymentEvent) TableName() string { return "payment_events" }

type Repository interface {
	CreateEvent(ctx context.Context, event *PaymentEvent) error
	EventExists(ctx context.Context, provider, eventID string) (bool, error)
}

type repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &repository{db: db}
}

func (r *repository) CreateEvent(ctx context.Context, event *PaymentEvent) error {
	return r.db.WithContext(ctx).Create(event).Error
}

func (r *repository) EventExists(ctx context.Context, provider, eventID string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&PaymentEvent{}).
		Where("provider = ? AND event_id = ?", provider, eventID).
		Count(&count).Error
	return count > 0, err
}

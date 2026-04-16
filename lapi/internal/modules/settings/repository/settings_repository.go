package repository

import (
	"context"
	"encoding/json"
	"fmt"

	"gorm.io/gorm"
)

// Setting represents a key-value row in the settings table.
type Setting struct {
	Key       string          `gorm:"primaryKey;size:100"`
	Value     json.RawMessage `gorm:"type:jsonb;not null"`
	UpdatedAt *string         `gorm:"autoUpdateTime"`
}

func (Setting) TableName() string { return "settings" }

// SettingsRepository provides access to the settings table.
type SettingsRepository interface {
	Get(ctx context.Context, key string, dest interface{}) error
	Set(ctx context.Context, key string, value interface{}) error
}

type settingsRepository struct {
	db *gorm.DB
}

func NewSettingsRepository(db *gorm.DB) SettingsRepository {
	return &settingsRepository{db: db}
}

func (r *settingsRepository) Get(ctx context.Context, key string, dest interface{}) error {
	var s Setting
	if err := r.db.WithContext(ctx).Where("key = ?", key).First(&s).Error; err != nil {
		return fmt.Errorf("setting %s not found: %w", key, err)
	}
	return json.Unmarshal(s.Value, dest)
}

func (r *settingsRepository) Set(ctx context.Context, key string, value interface{}) error {
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("marshal setting %s: %w", key, err)
	}
	s := Setting{Key: key, Value: data}
	return r.db.WithContext(ctx).
		Where("key = ?", key).
		Assign(Setting{Value: data}).
		FirstOrCreate(&s).Error
}

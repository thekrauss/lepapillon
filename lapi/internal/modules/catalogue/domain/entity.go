package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Category struct {
	ID          uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Name        string         `gorm:"size:100;not null" json:"name"`
	Slug        string         `gorm:"size:100;uniqueIndex;not null" json:"slug"`
	Description string         `gorm:"type:text" json:"description"`
	ImageURL    string         `gorm:"size:500" json:"image_url"`
	Position    int            `gorm:"default:0" json:"position"`
	IsActive    bool           `gorm:"default:true" json:"is_active"`
	Products    []Product      `gorm:"foreignKey:CategoryID" json:"products,omitempty"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Category) TableName() string { return "categories" }

type Product struct {
	ID              uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	CategoryID      uuid.UUID      `gorm:"type:uuid;index" json:"category_id"`
	Category        *Category      `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Name            string         `gorm:"size:200;not null" json:"name"`
	Slug            string         `gorm:"size:200;uniqueIndex;not null" json:"slug"`
	Description     string         `gorm:"type:text" json:"description"`
	Price           int64          `gorm:"not null" json:"price"`
	ImageURL        string         `gorm:"size:500" json:"image_url"`
	Stock           int            `gorm:"default:0" json:"stock"`
	IsActive        bool           `gorm:"default:true;index" json:"is_active"`
	IsFeatured      bool           `gorm:"default:false" json:"is_featured"`
	IsKit           bool           `gorm:"default:false" json:"is_kit"`
	PrepTimeMinutes *int           `json:"prep_time_minutes"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Product) TableName() string { return "products" }

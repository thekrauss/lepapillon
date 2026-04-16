package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID             uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	KeycloakUserID string         `gorm:"size:255;uniqueIndex" json:"keycloak_user_id,omitempty"`
	Email          string         `gorm:"uniqueIndex;size:255;not null" json:"email"`
	PasswordHash   string         `gorm:"size:255" json:"-"`
	FirstName      string         `gorm:"size:100" json:"first_name"`
	LastName       string         `gorm:"size:100" json:"last_name"`
	Phone          string         `gorm:"size:20" json:"phone"`
	Role           string         `gorm:"size:20;default:client" json:"role"`
	Addresses      []Address      `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"addresses,omitempty"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string { return "users" }

// User roles
const (
	RoleClient = "client"
	RoleAdmin  = "admin"
)

func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}

func (u *User) FullName() string {
	if u.FirstName == "" && u.LastName == "" {
		return ""
	}
	if u.LastName == "" {
		return u.FirstName
	}
	return u.FirstName + " " + u.LastName
}

type Address struct {
	ID         uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID     uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	Label      string    `gorm:"size:50" json:"label"`
	Street     string    `gorm:"size:255;not null" json:"street"`
	City       string    `gorm:"size:100;not null" json:"city"`
	PostalCode string    `gorm:"size:10;not null" json:"postal_code"`
	IsDefault  bool      `gorm:"default:false" json:"is_default"`
	CreatedAt  time.Time `json:"created_at"`
}

func (Address) TableName() string { return "addresses" }

type RefreshToken struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"user_id"`
	User      *User     `gorm:"foreignKey:UserID" json:"-"`
	TokenHash string    `gorm:"size:255;not null" json:"-"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time `json:"created_at"`
}

func (RefreshToken) TableName() string { return "refresh_tokens" }

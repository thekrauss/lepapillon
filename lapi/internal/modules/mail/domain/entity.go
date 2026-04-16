package domain

import (
	"time"

	"github.com/google/uuid"
)

type EmailLog struct {
	ID         uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID     *uuid.UUID `gorm:"type:uuid;index" json:"user_id,omitempty"`
	To         string     `gorm:"size:255;not null" json:"to"`
	Subject    string    `gorm:"size:500;not null" json:"subject"`
	Template   string    `gorm:"size:100;not null" json:"template"`
	Status     string    `gorm:"size:20;default:sent" json:"status"`
	Error      string    `gorm:"type:text" json:"error,omitempty"`
	SentAt     time.Time `json:"sent_at"`
	CreatedAt  time.Time `json:"created_at"`
}

func (EmailLog) TableName() string { return "email_logs" }

// Email statuses
const (
	EmailStatusSent   = "sent"
	EmailStatusFailed = "failed"
)

// Template names
const (
	TemplateWelcome             = "welcome"
	TemplateOrderConfirmation   = "order_confirmation"
	TemplatePrestationReminder  = "prestation_reminder"
	TemplateOrderReady          = "order_ready"
)

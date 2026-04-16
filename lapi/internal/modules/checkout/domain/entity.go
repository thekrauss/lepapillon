package domain

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Order struct {
	ID                     uuid.UUID      `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID                 uuid.UUID      `gorm:"type:uuid;not null;index" json:"user_id"`
	Status                 string         `gorm:"size:20;default:pending;index" json:"status"`
	ItemsTotal             int64          `gorm:"not null" json:"items_total"`
	PrestationTotal        int64          `gorm:"default:0" json:"prestation_total"`
	Total                  int64          `gorm:"not null" json:"total"`
	StripePaymentIntentID  string         `gorm:"size:100" json:"stripe_payment_intent_id,omitempty"`
	PickupCode             string         `gorm:"size:10" json:"pickup_code"`
	Notes                  string         `gorm:"type:text" json:"notes,omitempty"`
	DeliveryFirstName      string         `gorm:"size:100" json:"delivery_first_name,omitempty"`
	DeliveryLastName       string         `gorm:"size:100" json:"delivery_last_name,omitempty"`
	DeliveryStreet         string         `gorm:"size:255" json:"delivery_street,omitempty"`
	DeliveryCity           string         `gorm:"size:100" json:"delivery_city,omitempty"`
	DeliveryPostalCode     string         `gorm:"size:10" json:"delivery_postal_code,omitempty"`
	DeliveryPhone          string         `gorm:"size:20" json:"delivery_phone,omitempty"`
	Items                  []OrderItem       `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"items,omitempty"`
	Prestation             *OrderPrestation  `gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE" json:"prestation,omitempty"`
	CreatedAt              time.Time      `json:"created_at"`
	UpdatedAt              time.Time      `json:"updated_at"`
	DeletedAt              gorm.DeletedAt `gorm:"index" json:"-"`
}

func (Order) TableName() string { return "orders" }

type OrderItem struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	OrderID     uuid.UUID `gorm:"type:uuid;not null;index" json:"order_id"`
	ProductID   uuid.UUID `gorm:"type:uuid" json:"product_id"`
	ProductName string    `gorm:"size:200;not null" json:"product_name"`
	Price       int64     `gorm:"not null" json:"price"`
	Quantity    int       `gorm:"not null" json:"quantity"`
}

func (OrderItem) TableName() string { return "order_items" }

type OrderPrestation struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	OrderID   uuid.UUID `gorm:"type:uuid;not null;uniqueIndex" json:"order_id"`
	BookingID uuid.UUID `gorm:"type:uuid;not null" json:"booking_id"`
	Price     int64     `gorm:"not null" json:"price"`
}

func (OrderPrestation) TableName() string { return "order_prestations" }

// Order statuses
const (
	OrderStatusPending   = "pending"
	OrderStatusPaid      = "paid"
	OrderStatusPreparing = "preparing"
	OrderStatusReady     = "ready"
	OrderStatusPickedUp  = "picked_up"
	OrderStatusCancelled = "cancelled"
)

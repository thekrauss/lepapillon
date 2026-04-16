package types

import (
	"time"

	"github.com/google/uuid"
)

type NoBody struct{}

// ── Path params ─────────────────────────────────────────────────────

type OrderIDPath struct {
	OrderID uuid.UUID `path:"orderId"`
}

// ── Request ─────────────────────────────────────────────────────────

type CreateOrderRequest struct {
	Notes             string `json:"notes" validate:"max=500"`
	DeliveryFirstName string `json:"delivery_first_name" validate:"required,max=100"`
	DeliveryLastName  string `json:"delivery_last_name" validate:"required,max=100"`
	DeliveryStreet    string `json:"delivery_street" validate:"required,max=255"`
	DeliveryCity      string `json:"delivery_city" validate:"required,max=100"`
	DeliveryPostalCode string `json:"delivery_postal_code" validate:"required,max=10"`
	DeliveryPhone     string `json:"delivery_phone" validate:"required,max=20"`
}

type ConfirmPaymentRequest struct {
	OrderIDPath
	StripePaymentIntentID string `json:"stripe_payment_intent_id" validate:"required"`
}

// ── Response ────────────────────────────────────────────────────────

type OrderItemResponse struct {
	ID          uuid.UUID `json:"id"`
	ProductID   uuid.UUID `json:"product_id"`
	ProductName string    `json:"product_name"`
	Price       int64     `json:"price"`
	Quantity    int       `json:"quantity"`
	Subtotal    int64     `json:"subtotal"`
}

type OrderPrestationResponse struct {
	BookingID uuid.UUID `json:"booking_id"`
	Price     int64     `json:"price"`
}

type OrderResponse struct {
	ID              uuid.UUID                `json:"id"`
	Status          string                   `json:"status"`
	Items           []OrderItemResponse      `json:"items"`
	Prestation      *OrderPrestationResponse `json:"prestation,omitempty"`
	ItemsTotal      int64                    `json:"items_total"`
	PrestationTotal int64                    `json:"prestation_total"`
	Total           int64                    `json:"total"`
	PickupCode      string                   `json:"pickup_code,omitempty"`
	Notes           string                   `json:"notes,omitempty"`
	CreatedAt       time.Time                `json:"created_at"`
}

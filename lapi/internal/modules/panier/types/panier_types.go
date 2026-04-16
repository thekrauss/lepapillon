package types

import (
	"time"

	"github.com/google/uuid"
)

// NoBody is used for tonic handlers that take no request body.
type NoBody struct{}

// ── Request DTOs ────────────────────────────────────────────────────

type AddItemRequest struct {
	ProductID uuid.UUID `json:"product_id" validate:"required"`
	Quantity  int       `json:"quantity" validate:"required,min=1,max=20"`
}

type UpdateItemRequest struct {
	ProductID uuid.UUID `json:"product_id" validate:"required"`
	Quantity  int       `json:"quantity" validate:"required,min=1,max=20"`
}

type RemoveItemInput struct {
	ProductID uuid.UUID `path:"productId"`
}

type SetPrestationRequest struct {
	Date       time.Time `json:"date" validate:"required"`
	TimeSlot   string    `json:"time_slot" validate:"required,oneof=12:00-14:00 19:00-21:00"`
	Street     string    `json:"street" validate:"required,max=255"`
	City       string    `json:"city" validate:"required,max=100"`
	PostalCode string    `json:"postal_code" validate:"required,max=10"`
	GuestCount int       `json:"guest_count" validate:"required,min=2,max=12"`
	Notes      string    `json:"notes" validate:"max=500"`
}

// ── Response DTOs ───────────────────────────────────────────────────

type CartItemResponse struct {
	ProductID   uuid.UUID `json:"product_id"`
	ProductName string    `json:"product_name"`
	Price       int64     `json:"price"`
	Quantity    int       `json:"quantity"`
	ImageURL    string    `json:"image_url"`
	Subtotal    int64     `json:"subtotal"` // price * quantity
}

type PrestationOptResponse struct {
	Date       time.Time `json:"date"`
	TimeSlot   string    `json:"time_slot"`
	Street     string    `json:"street"`
	City       string    `json:"city"`
	PostalCode string    `json:"postal_code"`
	GuestCount int       `json:"guest_count"`
	Notes      string    `json:"notes"`
	Price      int64     `json:"price"`
}

type CartResponse struct {
	Items           []CartItemResponse      `json:"items"`
	Prestation      *PrestationOptResponse   `json:"prestation,omitempty"`
	ItemsTotal      int64                    `json:"items_total"`
	PrestationTotal int64                    `json:"prestation_total"`
	Total           int64                    `json:"total"`
	ItemCount       int                      `json:"item_count"`
}

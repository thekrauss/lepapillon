package domain

import (
	"time"

	"github.com/google/uuid"
)

// Cart is stored in Redis, not in the database.
type Cart struct {
	UserID     string         `json:"user_id"`
	Items      []CartItem     `json:"items"`
	Prestation *PrestationOpt `json:"prestation,omitempty"`
	UpdatedAt  time.Time      `json:"updated_at"`
}

type CartItem struct {
	ProductID   uuid.UUID `json:"product_id"`
	ProductName string    `json:"product_name"`
	Price       int64     `json:"price"`
	Quantity    int       `json:"quantity"`
	ImageURL    string    `json:"image_url"`
}

type PrestationOpt struct {
	Date       time.Time `json:"date"`
	TimeSlot   string    `json:"time_slot"`
	Street     string    `json:"street"`
	City       string    `json:"city"`
	PostalCode string    `json:"postal_code"`
	GuestCount int       `json:"guest_count"`
	Notes      string    `json:"notes"`
	Price      int64     `json:"price"`
}

// Total returns the sum of all items + prestation price in centimes.
func (c *Cart) Total() int64 {
	var t int64
	for _, item := range c.Items {
		t += item.Price * int64(item.Quantity)
	}
	if c.Prestation != nil {
		t += c.Prestation.Price
	}
	return t
}

// ItemsTotal returns the sum of product items only, in centimes.
func (c *Cart) ItemsTotal() int64 {
	var t int64
	for _, item := range c.Items {
		t += item.Price * int64(item.Quantity)
	}
	return t
}

// PrestationTotal returns the prestation price or 0.
func (c *Cart) PrestationTotal() int64 {
	if c.Prestation != nil {
		return c.Prestation.Price
	}
	return 0
}

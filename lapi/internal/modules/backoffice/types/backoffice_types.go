package types

import (
	"time"

	"github.com/google/uuid"
	settingstypes "github.com/thekrauss/lepapillon/internal/modules/settings/types"
)

type NoBody struct{}

type OrderIDPath struct {
	OrderID string `path:"orderId"`
}

type UpdateOrderStatusRequest struct {
	OrderIDPath
	Status string `json:"status" validate:"required,oneof=pending paid preparing ready picked_up cancelled"`
}

// ── Dashboard ───────────────────────────────────────────────────────

type DashboardResponse struct {
	TotalRevenue    int64              `json:"total_revenue"`
	OrderCount      int64              `json:"order_count"`
	PrestationCount int64              `json:"prestation_count"`
	CustomerCount   int64              `json:"customer_count"`
	PendingOrders   int64              `json:"pending_orders"`
	RecentOrders    []RecentOrderEntry `json:"recent_orders"`
}

type RecentOrderEntry struct {
	OrderID   uuid.UUID `json:"order_id"`
	UserEmail string    `json:"user_email"`
	Total     int64     `json:"total"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

type ClientEntry struct {
	UserID     uuid.UUID `json:"user_id"`
	Email      string    `json:"email"`
	FirstName  string    `json:"first_name"`
	LastName   string    `json:"last_name"`
	Phone      string    `json:"phone"`
	OrderCount int64     `json:"order_count"`
	TotalSpent int64     `json:"total_spent"`
	CreatedAt  time.Time `json:"created_at"`
}

// ── Admin slot (all slots with reservation info) ───────────────────

type AdminSlotResponse struct {
	ID          uuid.UUID `json:"id"`
	Date        time.Time `json:"date"`
	TimeSlot    string    `json:"time_slot"`
	IsAvailable bool      `json:"is_available"`
	Status      string    `json:"status"` // "available", "booked", "blocked"
	BookedBy    string    `json:"booked_by,omitempty"`
	GuestCount  int       `json:"guest_count,omitempty"`
}

// ── Booking detail (enriched with order items) ─────────────────────

type BookingDetailResponse struct {
	BookingID         uuid.UUID          `json:"booking_id"`
	OrderID           uuid.UUID          `json:"order_id"`
	UserEmail         string             `json:"user_email"`
	UserName          string             `json:"user_name"`
	SlotDate          time.Time          `json:"slot_date"`
	TimeSlot          string             `json:"time_slot"`
	AddressStreet     string             `json:"address_street"`
	AddressCity       string             `json:"address_city"`
	AddressPostalCode string             `json:"address_postal_code"`
	GuestCount        int                `json:"guest_count"`
	Notes             string             `json:"notes"`
	Status            string             `json:"status"`
	OrderItems        []BookingOrderItem `json:"order_items"`
	OrderTotal        int64              `json:"order_total"`
	CreatedAt         time.Time          `json:"created_at"`
}

type BookingOrderItem struct {
	ProductName string `json:"product_name"`
	Quantity    int    `json:"quantity"`
	Price       int64  `json:"price"`
}

// ── Settings ────────────────────────────────────────────────────────

type PrestationPricingResponse = settingstypes.PrestationPricing
type UpdatePrestationPricingRequest = settingstypes.UpdatePrestationPricingRequest

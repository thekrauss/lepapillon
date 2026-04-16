package domain

import (
	"time"

	"github.com/google/uuid"
)

// DashboardStats represents the admin dashboard overview.
type DashboardStats struct {
	TotalRevenue     int64          `json:"total_revenue"`
	OrderCount       int64          `json:"order_count"`
	PrestationCount  int64          `json:"prestation_count"`
	CustomerCount    int64          `json:"customer_count"`
	PendingOrders    int64          `json:"pending_orders"`
	TopProducts      []TopProduct   `json:"top_products"`
	RecentOrders     []RecentOrder  `json:"recent_orders"`
	RevenueByDay     []DailyRevenue `json:"revenue_by_day"`
}

type TopProduct struct {
	ProductID   uuid.UUID `json:"product_id"`
	ProductName string    `json:"product_name"`
	TotalSold   int       `json:"total_sold"`
	Revenue     int64     `json:"revenue"`
}

type RecentOrder struct {
	OrderID    uuid.UUID `json:"order_id"`
	UserEmail  string    `json:"user_email"`
	Total      int64     `json:"total"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type DailyRevenue struct {
	Date    string `json:"date"`
	Revenue int64  `json:"revenue"`
	Orders  int64  `json:"orders"`
}

// DashboardFilter allows filtering dashboard stats by date range.
type DashboardFilter struct {
	From *time.Time `json:"from"`
	To   *time.Time `json:"to"`
}

// OrderFilter for listing/filtering orders in the backoffice.
type OrderFilter struct {
	Status *string    `json:"status"`
	From   *time.Time `json:"from"`
	To     *time.Time `json:"to"`
	UserID *uuid.UUID `json:"user_id"`
	Page   int        `json:"page"`
	Limit  int        `json:"limit"`
}

// PrestationPlanningEntry represents a slot + its booking (if any) for the planning view.
type PrestationPlanningEntry struct {
	SlotID      uuid.UUID  `json:"slot_id"`
	Date        time.Time  `json:"date"`
	TimeSlot    string     `json:"time_slot"`
	IsAvailable bool       `json:"is_available"`
	BookingID   *uuid.UUID `json:"booking_id,omitempty"`
	UserEmail   string     `json:"user_email,omitempty"`
	GuestCount  int        `json:"guest_count,omitempty"`
	Status      string     `json:"status,omitempty"`
}

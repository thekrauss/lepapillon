package types

import (
	"time"

	"github.com/google/uuid"
)

type NoBody struct{}

type SlotIDPath struct {
	SlotID uuid.UUID `path:"slotId"`
}

type BookingIDPath struct {
	BookingID uuid.UUID `path:"bookingId"`
}

// ── Responses ───────────────────────────────────────────────────────

type SlotResponse struct {
	ID          uuid.UUID `json:"id"`
	Date        time.Time `json:"date"`
	TimeSlot    string    `json:"time_slot"`
	IsAvailable bool      `json:"is_available"`
}

type BookingResponse struct {
	ID                uuid.UUID     `json:"id"`
	UserID            uuid.UUID     `json:"user_id"`
	OrderID           uuid.UUID     `json:"order_id"`
	Slot              *SlotResponse `json:"slot,omitempty"`
	AddressStreet     string        `json:"address_street"`
	AddressCity       string        `json:"address_city"`
	AddressPostalCode string        `json:"address_postal_code"`
	GuestCount        int           `json:"guest_count"`
	Notes             string        `json:"notes"`
	Status            string        `json:"status"`
	CreatedAt         time.Time     `json:"created_at"`
}

// ── Admin requests ──────────────────────────────────────────────────

type CreateSlotRequest struct {
	Date     string `json:"date" validate:"required"`      // YYYY-MM-DD
	TimeSlot string `json:"time_slot" validate:"required"` // HH:MM-HH:MM (free format)
}

type BlockSlotInput struct {
	SlotIDPath
}

type UnblockSlotInput struct {
	SlotIDPath
}

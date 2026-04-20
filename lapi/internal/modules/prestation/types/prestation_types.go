package types

import (
	"time"

	"github.com/google/uuid"
)

type NoBody struct{}

type SlotIDPath struct {
	SlotID string `path:"slotId"`
}

type BookingIDPath struct {
	BookingID string `path:"bookingId"`
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
	ChefNotes         string        `json:"chef_notes,omitempty"`
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

// ── Admin booking management ────────────────────────────────────────

type UpdateBookingStatusInput struct {
	BookingIDPath
	Status string `json:"status" validate:"required,oneof=confirmed completed cancelled"`
}

type UpdateChefNotesInput struct {
	BookingIDPath
	Notes string `json:"notes"`
}

type CancelBookingInput struct {
	BookingIDPath
	Reason string `json:"reason"`
	Refund bool   `json:"refund"`
}

type NotifyBookingInput struct {
	BookingIDPath
}

// ── Extended admin booking response ────────────────────────────────

type BookingAdminResponse struct {
	BookingResponse
	ChefNotes string `json:"chef_notes,omitempty"`
}

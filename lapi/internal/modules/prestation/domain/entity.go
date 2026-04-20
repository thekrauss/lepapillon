package domain

import (
	"time"

	"github.com/google/uuid"
)

type PrestationSlot struct {
	ID          uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	Date        time.Time `gorm:"type:date;not null;uniqueIndex:idx_slot_date_time;index:idx_prestation_slots_date" json:"date"`
	TimeSlot    string    `gorm:"size:20;not null;uniqueIndex:idx_slot_date_time" json:"time_slot"`
	IsAvailable bool      `gorm:"default:true" json:"is_available"`
}

func (PrestationSlot) TableName() string { return "prestation_slots" }

type PrestationBooking struct {
	ID                uuid.UUID       `gorm:"type:uuid;default:gen_random_uuid();primaryKey" json:"id"`
	UserID            uuid.UUID       `gorm:"type:uuid;not null;index" json:"user_id"`
	OrderID           uuid.UUID       `gorm:"type:uuid;not null;index" json:"order_id"`
	SlotID            uuid.UUID       `gorm:"type:uuid;not null" json:"slot_id"`
	Slot              *PrestationSlot `gorm:"foreignKey:SlotID" json:"slot,omitempty"`
	AddressStreet     string          `gorm:"size:255;not null" json:"address_street"`
	AddressCity       string          `gorm:"size:100;not null" json:"address_city"`
	AddressPostalCode string          `gorm:"size:10;not null" json:"address_postal_code"`
	GuestCount        int             `gorm:"not null" json:"guest_count"`
	Notes             string          `gorm:"type:text" json:"notes"`
	ChefNotes         string          `gorm:"type:text;default:''" json:"chef_notes,omitempty"`
	Status            string          `gorm:"size:20;default:confirmed" json:"status"`
	CreatedAt         time.Time       `json:"created_at"`
}

func (PrestationBooking) TableName() string { return "prestation_bookings" }

// Booking statuses
const (
	BookingStatusConfirmed = "confirmed"
	BookingStatusCompleted = "completed"
	BookingStatusCancelled = "cancelled"
)

// Available time slots
const (
	TimeSlotLunch  = "12:00-14:00"
	TimeSlotDinner = "19:00-21:00"
)

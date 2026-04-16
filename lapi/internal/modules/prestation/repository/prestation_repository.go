package repository

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	coredomain "github.com/thekrauss/lepapillon/internal/core/domain"
	"github.com/thekrauss/lepapillon/internal/modules/prestation/domain"
	"gorm.io/gorm"
)

type PrestationRepository interface {
	// Slots
	ListAvailableSlots(ctx context.Context, from time.Time) ([]domain.PrestationSlot, error)
	GetSlotByID(ctx context.Context, id uuid.UUID) (*domain.PrestationSlot, error)
	CreateSlot(ctx context.Context, slot *domain.PrestationSlot) error
	BlockSlot(ctx context.Context, slotID uuid.UUID) error
	UnblockSlot(ctx context.Context, slotID uuid.UUID) error

	// Bookings
	CreateBooking(ctx context.Context, booking *domain.PrestationBooking) error
	GetBookingByID(ctx context.Context, id uuid.UUID) (*domain.PrestationBooking, error)
	ListBookingsByUser(ctx context.Context, userID uuid.UUID) ([]domain.PrestationBooking, error)
	ListAllBookings(ctx context.Context, limit, offset int) ([]domain.PrestationBooking, int64, error)
	CancelBooking(ctx context.Context, id uuid.UUID) error
}

type prestationRepository struct {
	db *gorm.DB
}

func NewPrestationRepository(db *gorm.DB) PrestationRepository {
	return &prestationRepository{db: db}
}

// ── Slots ───────────────────────────────────────────────────────────

func (r *prestationRepository) ListAvailableSlots(ctx context.Context, from time.Time) ([]domain.PrestationSlot, error) {
	var slots []domain.PrestationSlot
	err := r.db.WithContext(ctx).
		Where("is_available = ? AND date >= ?", true, from).
		Order("date ASC, time_slot ASC").
		Find(&slots).Error
	return slots, err
}

func (r *prestationRepository) GetSlotByID(ctx context.Context, id uuid.UUID) (*domain.PrestationSlot, error) {
	var slot domain.PrestationSlot
	err := r.db.WithContext(ctx).First(&slot, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, coredomain.ErrNotFound
	}
	return &slot, err
}

func (r *prestationRepository) CreateSlot(ctx context.Context, slot *domain.PrestationSlot) error {
	return r.db.WithContext(ctx).Create(slot).Error
}

func (r *prestationRepository) BlockSlot(ctx context.Context, slotID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&domain.PrestationSlot{}).Where("id = ?", slotID).Update("is_available", false).Error
}

func (r *prestationRepository) UnblockSlot(ctx context.Context, slotID uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&domain.PrestationSlot{}).Where("id = ?", slotID).Update("is_available", true).Error
}

// ── Bookings ────────────────────────────────────────────────────────

func (r *prestationRepository) CreateBooking(ctx context.Context, booking *domain.PrestationBooking) error {
	return r.db.WithContext(ctx).Create(booking).Error
}

func (r *prestationRepository) GetBookingByID(ctx context.Context, id uuid.UUID) (*domain.PrestationBooking, error) {
	var booking domain.PrestationBooking
	err := r.db.WithContext(ctx).Preload("Slot").First(&booking, "id = ?", id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, coredomain.ErrNotFound
	}
	return &booking, err
}

func (r *prestationRepository) ListBookingsByUser(ctx context.Context, userID uuid.UUID) ([]domain.PrestationBooking, error) {
	var bookings []domain.PrestationBooking
	err := r.db.WithContext(ctx).Preload("Slot").Where("user_id = ?", userID).Order("created_at DESC").Find(&bookings).Error
	return bookings, err
}

func (r *prestationRepository) ListAllBookings(ctx context.Context, limit, offset int) ([]domain.PrestationBooking, int64, error) {
	var bookings []domain.PrestationBooking
	var total int64
	q := r.db.WithContext(ctx).Model(&domain.PrestationBooking{})
	q.Count(&total)
	if limit <= 0 {
		limit = 20
	}
	err := q.Preload("Slot").Order("created_at DESC").Limit(limit).Offset(offset).Find(&bookings).Error
	return bookings, total, err
}

func (r *prestationRepository) CancelBooking(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Model(&domain.PrestationBooking{}).Where("id = ?", id).Update("status", domain.BookingStatusCancelled).Error
}

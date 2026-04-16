package usecase

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/thekrauss/lepapillon/internal/modules/prestation/domain"
	"github.com/thekrauss/lepapillon/internal/modules/prestation/repository"
	"github.com/thekrauss/lepapillon/internal/modules/prestation/types"
)

type IPrestationUseCase interface {
	ListAvailableSlots(ctx context.Context) ([]types.SlotResponse, error)
	ListUserBookings(ctx context.Context, userID uuid.UUID) ([]types.BookingResponse, error)
	GetBooking(ctx context.Context, bookingID uuid.UUID) (*types.BookingResponse, error)

	// Admin
	CreateSlot(ctx context.Context, req *types.CreateSlotRequest) (*types.SlotResponse, error)
	BlockSlot(ctx context.Context, slotID uuid.UUID) error
	UnblockSlot(ctx context.Context, slotID uuid.UUID) error
	ListAllBookings(ctx context.Context, limit, offset int) ([]types.BookingResponse, int64, error)
}

type prestationUseCase struct {
	repo repository.PrestationRepository
}

func NewPrestationUseCase(repo repository.PrestationRepository) IPrestationUseCase {
	return &prestationUseCase{repo: repo}
}

func (uc *prestationUseCase) ListAvailableSlots(ctx context.Context) ([]types.SlotResponse, error) {
	slots, err := uc.repo.ListAvailableSlots(ctx, time.Now())
	if err != nil {
		return nil, err
	}
	out := make([]types.SlotResponse, len(slots))
	for i, s := range slots {
		out[i] = mapSlotResponse(s)
	}
	return out, nil
}

func (uc *prestationUseCase) ListUserBookings(ctx context.Context, userID uuid.UUID) ([]types.BookingResponse, error) {
	bookings, err := uc.repo.ListBookingsByUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]types.BookingResponse, len(bookings))
	for i, b := range bookings {
		out[i] = mapBookingResponse(b)
	}
	return out, nil
}

func (uc *prestationUseCase) GetBooking(ctx context.Context, bookingID uuid.UUID) (*types.BookingResponse, error) {
	b, err := uc.repo.GetBookingByID(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	resp := mapBookingResponse(*b)
	return &resp, nil
}

func (uc *prestationUseCase) CreateSlot(ctx context.Context, req *types.CreateSlotRequest) (*types.SlotResponse, error) {
	date, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, err
	}
	slot := &domain.PrestationSlot{
		ID:          uuid.New(),
		Date:        date,
		TimeSlot:    req.TimeSlot,
		IsAvailable: true,
	}
	if err := uc.repo.CreateSlot(ctx, slot); err != nil {
		return nil, err
	}
	resp := mapSlotResponse(*slot)
	return &resp, nil
}

func (uc *prestationUseCase) BlockSlot(ctx context.Context, slotID uuid.UUID) error {
	return uc.repo.BlockSlot(ctx, slotID)
}

func (uc *prestationUseCase) UnblockSlot(ctx context.Context, slotID uuid.UUID) error {
	return uc.repo.UnblockSlot(ctx, slotID)
}

func (uc *prestationUseCase) ListAllBookings(ctx context.Context, limit, offset int) ([]types.BookingResponse, int64, error) {
	bookings, total, err := uc.repo.ListAllBookings(ctx, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	out := make([]types.BookingResponse, len(bookings))
	for i, b := range bookings {
		out[i] = mapBookingResponse(b)
	}
	return out, total, nil
}

// ── mappers ─────────────────────────────────────────────────────────

func mapSlotResponse(s domain.PrestationSlot) types.SlotResponse {
	return types.SlotResponse{ID: s.ID, Date: s.Date, TimeSlot: s.TimeSlot, IsAvailable: s.IsAvailable}
}

func mapBookingResponse(b domain.PrestationBooking) types.BookingResponse {
	resp := types.BookingResponse{
		ID: b.ID, UserID: b.UserID, OrderID: b.OrderID,
		AddressStreet: b.AddressStreet, AddressCity: b.AddressCity,
		AddressPostalCode: b.AddressPostalCode, GuestCount: b.GuestCount,
		Notes: b.Notes, Status: b.Status, CreatedAt: b.CreatedAt,
	}
	if b.Slot != nil {
		s := mapSlotResponse(*b.Slot)
		resp.Slot = &s
	}
	return resp
}

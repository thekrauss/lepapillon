package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	authdomain "github.com/thekrauss/lepapillon/internal/modules/auth/domain"
	checkoutrepo "github.com/thekrauss/lepapillon/internal/modules/checkout/repository"
	"github.com/thekrauss/lepapillon/internal/infras/worker"
	"github.com/thekrauss/lepapillon/internal/modules/prestation/domain"
	"github.com/thekrauss/lepapillon/internal/modules/prestation/repository"
	"github.com/thekrauss/lepapillon/internal/modules/prestation/types"
	paymentsvc "github.com/thekrauss/lepapillon/internal/modules/payment/services"
)

var ErrBookingNotCancellable = errors.New("booking cannot be cancelled in its current state")

type IPrestationUseCase interface {
	ListAvailableSlots(ctx context.Context) ([]types.SlotResponse, error)
	ListUserBookings(ctx context.Context, userID uuid.UUID) ([]types.BookingResponse, error)
	GetBooking(ctx context.Context, bookingID uuid.UUID) (*types.BookingResponse, error)

	// Admin — slots
	CreateSlot(ctx context.Context, req *types.CreateSlotRequest) (*types.SlotResponse, error)
	BlockSlot(ctx context.Context, slotID uuid.UUID) error
	UnblockSlot(ctx context.Context, slotID uuid.UUID) error
	ListAllBookings(ctx context.Context, limit, offset int) ([]types.BookingResponse, int64, error)

	// Admin — bookings management (features 6–9)
	UpdateBookingStatus(ctx context.Context, bookingID uuid.UUID, status string) (*types.BookingResponse, error)
	UpdateChefNotes(ctx context.Context, bookingID uuid.UUID, notes string) (*types.BookingResponse, error)
	NotifyClient(ctx context.Context, bookingID uuid.UUID) error
	CancelWithRefund(ctx context.Context, bookingID uuid.UUID, reason string, doRefund bool) (*types.BookingResponse, error)
}

// Deps bundles optional collaborators injected at wire-up time.
type Deps struct {
	UserRepo     authdomain.UserRepository
	CheckoutRepo checkoutrepo.CheckoutRepository
	Payment      paymentsvc.Service
	Distributor  worker.TaskDistributor
}

type prestationUseCase struct {
	repo repository.PrestationRepository
	deps Deps
}

func NewPrestationUseCase(repo repository.PrestationRepository, deps Deps) IPrestationUseCase {
	return &prestationUseCase{repo: repo, deps: deps}
}

// ── Public ──────────────────────────────────────────────────────────

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

// ── Admin — slots ────────────────────────────────────────────────────

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

// ── Admin — booking management ───────────────────────────────────────

// Feature 6: change booking status
func (uc *prestationUseCase) UpdateBookingStatus(ctx context.Context, bookingID uuid.UUID, status string) (*types.BookingResponse, error) {
	if err := uc.repo.UpdateBookingStatus(ctx, bookingID, status); err != nil {
		return nil, err
	}
	return uc.GetBooking(ctx, bookingID)
}

// Feature 8: update chef internal notes
func (uc *prestationUseCase) UpdateChefNotes(ctx context.Context, bookingID uuid.UUID, notes string) (*types.BookingResponse, error) {
	if err := uc.repo.UpdateChefNotes(ctx, bookingID, notes); err != nil {
		return nil, err
	}
	return uc.GetBooking(ctx, bookingID)
}

// Feature 7: send reminder email to client
func (uc *prestationUseCase) NotifyClient(ctx context.Context, bookingID uuid.UUID) error {
	b, err := uc.repo.GetBookingByID(ctx, bookingID)
	if err != nil {
		return err
	}

	if uc.deps.UserRepo == nil || uc.deps.Distributor == nil {
		return fmt.Errorf("notify: mail dependencies not configured")
	}

	user, err := uc.deps.UserRepo.GetByID(ctx, b.UserID)
	if err != nil {
		return fmt.Errorf("notify: user not found: %w", err)
	}

	var dateStr, timeSlot, address string
	if b.Slot != nil {
		dateStr = b.Slot.Date.Format("02/01/2006")
		timeSlot = b.Slot.TimeSlot
	}
	address = fmt.Sprintf("%s, %s %s", b.AddressStreet, b.AddressPostalCode, b.AddressCity)

	return uc.deps.Distributor.DistributeMailTask(ctx,
		[]string{user.Email},
		"Rappel — Votre prestation cheffe à domicile",
		"prestation_reminder",
		map[string]string{
			"Name":     user.FullName(),
			"Date":     dateStr,
			"TimeSlot": timeSlot,
			"Address":  address,
		},
	)
}

// Feature 9: cancel booking + optional Stripe refund
func (uc *prestationUseCase) CancelWithRefund(ctx context.Context, bookingID uuid.UUID, reason string, doRefund bool) (*types.BookingResponse, error) {
	b, err := uc.repo.GetBookingByID(ctx, bookingID)
	if err != nil {
		return nil, err
	}
	if b.Status == domain.BookingStatusCancelled {
		return nil, ErrBookingNotCancellable
	}

	// Issue Stripe refund when requested and payment service is configured
	if doRefund && uc.deps.Payment != nil && uc.deps.CheckoutRepo != nil {
		order, orderErr := uc.deps.CheckoutRepo.GetOrderByID(ctx, b.OrderID)
		if orderErr == nil && order.StripePaymentIntentID != "" {
			meta := map[string]string{
				"reason":     reason,
				"booking_id": bookingID.String(),
			}
			if _, refundErr := uc.deps.Payment.RefundIntent(order.StripePaymentIntentID, nil, meta); refundErr != nil {
				return nil, fmt.Errorf("refund failed: %w", refundErr)
			}
		}
	}

	// Mark booking cancelled
	if err := uc.repo.CancelBooking(ctx, bookingID); err != nil {
		return nil, err
	}

	// Send cancellation email (best-effort, non-blocking)
	if uc.deps.UserRepo != nil && uc.deps.Distributor != nil {
		if user, uErr := uc.deps.UserRepo.GetByID(ctx, b.UserID); uErr == nil {
			var dateStr string
			if b.Slot != nil {
				dateStr = b.Slot.Date.Format("02/01/2006")
			}
			_ = uc.deps.Distributor.DistributeMailTask(ctx,
				[]string{user.Email},
				"Votre prestation a été annulée",
				"prestation_cancelled",
				map[string]string{
					"Name":   user.FullName(),
					"Date":   dateStr,
					"Reason": reason,
					"Refund": fmt.Sprintf("%v", doRefund),
				},
			)
		}
	}

	return uc.GetBooking(ctx, bookingID)
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
		Notes: b.Notes, ChefNotes: b.ChefNotes, Status: b.Status, CreatedAt: b.CreatedAt,
	}
	if b.Slot != nil {
		s := mapSlotResponse(*b.Slot)
		resp.Slot = &s
	}
	return resp
}

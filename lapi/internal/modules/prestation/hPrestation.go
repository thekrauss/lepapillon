package prestation

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	coredomain "github.com/thekrauss/lepapillon/internal/core/domain"
	"github.com/thekrauss/lepapillon/internal/modules/prestation/types"
	"github.com/thekrauss/lepapillon/internal/modules/prestation/usecase"
)

type IPrestationController interface {
	ListAvailableSlots(c *gin.Context, in *types.NoBody) ([]types.SlotResponse, error)
	ListUserBookings(c *gin.Context, in *types.NoBody) ([]types.BookingResponse, error)
	GetBooking(c *gin.Context, in *types.BookingIDPath) (*types.BookingResponse, error)
	CreateSlot(c *gin.Context, in *types.CreateSlotRequest) (*types.SlotResponse, error)
	BlockSlot(c *gin.Context, in *types.BlockSlotInput) error
	UnblockSlot(c *gin.Context, in *types.UnblockSlotInput) error
	ListAllBookings(c *gin.Context, in *types.NoBody) ([]types.BookingResponse, error)
	UpdateBookingStatus(c *gin.Context, in *types.UpdateBookingStatusInput) (*types.BookingResponse, error)
	UpdateChefNotes(c *gin.Context, in *types.UpdateChefNotesInput) (*types.BookingResponse, error)
	NotifyClient(c *gin.Context, in *types.NotifyBookingInput) error
	CancelWithRefund(c *gin.Context, in *types.CancelBookingInput) (*types.BookingResponse, error)
}

type PrestationController struct {
	uc usecase.IPrestationUseCase
}

func NewPrestationController(uc usecase.IPrestationUseCase) IPrestationController {
	return &PrestationController{uc: uc}
}

func (ctrl *PrestationController) ListAvailableSlots(c *gin.Context, _ *types.NoBody) ([]types.SlotResponse, error) {
	return ctrl.uc.ListAvailableSlots(c.Request.Context())
}

func (ctrl *PrestationController) ListUserBookings(c *gin.Context, _ *types.NoBody) ([]types.BookingResponse, error) {
	userID, err := userUUID(c)
	if err != nil {
		return nil, err
	}
	return ctrl.uc.ListUserBookings(c.Request.Context(), userID)
}

func (ctrl *PrestationController) GetBooking(c *gin.Context, in *types.BookingIDPath) (*types.BookingResponse, error) {
	id, err := uuid.Parse(in.BookingID)
	if err != nil {
		return nil, errors.New("invalid booking ID")
	}
	return ctrl.uc.GetBooking(c.Request.Context(), id)
}

func (ctrl *PrestationController) CreateSlot(c *gin.Context, in *types.CreateSlotRequest) (*types.SlotResponse, error) {
	return ctrl.uc.CreateSlot(c.Request.Context(), in)
}

func (ctrl *PrestationController) BlockSlot(c *gin.Context, in *types.BlockSlotInput) error {
	id, err := uuid.Parse(in.SlotID)
	if err != nil {
		return errors.New("invalid slot ID")
	}
	return ctrl.uc.BlockSlot(c.Request.Context(), id)
}

func (ctrl *PrestationController) UnblockSlot(c *gin.Context, in *types.UnblockSlotInput) error {
	id, err := uuid.Parse(in.SlotID)
	if err != nil {
		return errors.New("invalid slot ID")
	}
	return ctrl.uc.UnblockSlot(c.Request.Context(), id)
}

func (ctrl *PrestationController) ListAllBookings(c *gin.Context, _ *types.NoBody) ([]types.BookingResponse, error) {
	bookings, _, err := ctrl.uc.ListAllBookings(c.Request.Context(), 50, 0)
	return bookings, err
}

// Feature 6: PUT /admin/prestations/bookings/:bookingId/status
func (ctrl *PrestationController) UpdateBookingStatus(c *gin.Context, in *types.UpdateBookingStatusInput) (*types.BookingResponse, error) {
	id, err := uuid.Parse(in.BookingID)
	if err != nil {
		return nil, errors.New("invalid booking ID")
	}
	return ctrl.uc.UpdateBookingStatus(c.Request.Context(), id, in.Status)
}

// Feature 8: PUT /admin/prestations/bookings/:bookingId/chef-notes
func (ctrl *PrestationController) UpdateChefNotes(c *gin.Context, in *types.UpdateChefNotesInput) (*types.BookingResponse, error) {
	id, err := uuid.Parse(in.BookingID)
	if err != nil {
		return nil, errors.New("invalid booking ID")
	}
	return ctrl.uc.UpdateChefNotes(c.Request.Context(), id, in.Notes)
}

// Feature 7: POST /admin/prestations/bookings/:bookingId/notify
func (ctrl *PrestationController) NotifyClient(c *gin.Context, in *types.NotifyBookingInput) error {
	id, err := uuid.Parse(in.BookingID)
	if err != nil {
		return errors.New("invalid booking ID")
	}
	return ctrl.uc.NotifyClient(c.Request.Context(), id)
}

// Feature 9: POST /admin/prestations/bookings/:bookingId/cancel
func (ctrl *PrestationController) CancelWithRefund(c *gin.Context, in *types.CancelBookingInput) (*types.BookingResponse, error) {
	id, err := uuid.Parse(in.BookingID)
	if err != nil {
		return nil, errors.New("invalid booking ID")
	}
	b, err := ctrl.uc.CancelWithRefund(c.Request.Context(), id, in.Reason, in.Refund)
	if errors.Is(err, usecase.ErrBookingNotCancellable) {
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		return nil, err
	}
	if errors.Is(err, coredomain.ErrNotFound) {
		c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
		return nil, err
	}
	return b, err
}

func userUUID(c *gin.Context) (uuid.UUID, error) {
	raw, ok := c.Get("user_id")
	if !ok {
		return uuid.Nil, errors.New("user context missing")
	}
	if s, ok := raw.(string); ok {
		return uuid.Parse(s)
	}
	if id, ok := raw.(uuid.UUID); ok {
		return id, nil
	}
	return uuid.Nil, errors.New("invalid user context")
}

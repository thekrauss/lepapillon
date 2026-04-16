package prestation

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	return ctrl.uc.GetBooking(c.Request.Context(), in.BookingID)
}

func (ctrl *PrestationController) CreateSlot(c *gin.Context, in *types.CreateSlotRequest) (*types.SlotResponse, error) {
	return ctrl.uc.CreateSlot(c.Request.Context(), in)
}

func (ctrl *PrestationController) BlockSlot(c *gin.Context, in *types.BlockSlotInput) error {
	return ctrl.uc.BlockSlot(c.Request.Context(), in.SlotID)
}

func (ctrl *PrestationController) UnblockSlot(c *gin.Context, in *types.UnblockSlotInput) error {
	return ctrl.uc.UnblockSlot(c.Request.Context(), in.SlotID)
}

func (ctrl *PrestationController) ListAllBookings(c *gin.Context, _ *types.NoBody) ([]types.BookingResponse, error) {
	bookings, _, err := ctrl.uc.ListAllBookings(c.Request.Context(), 50, 0)
	return bookings, err
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

package backoffice

import (
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/thekrauss/lepapillon/internal/modules/backoffice/types"
	"github.com/thekrauss/lepapillon/internal/modules/backoffice/usecase"
	settingstypes "github.com/thekrauss/lepapillon/internal/modules/settings/types"
)

type IBackofficeController interface {
	GetDashboard(c *gin.Context, in *types.NoBody) (*types.DashboardResponse, error)
	ListOrders(c *gin.Context, in *types.NoBody) ([]types.RecentOrderEntry, error)
	GetOrderDetail(c *gin.Context, in *types.OrderIDPath) (*types.OrderDetailResponse, error)
	ListClients(c *gin.Context, in *types.NoBody) ([]types.ClientEntry, error)
	ListBookingDetails(c *gin.Context, in *types.NoBody) ([]types.BookingDetailResponse, error)
	ListAllSlots(c *gin.Context, in *types.NoBody) ([]types.AdminSlotResponse, error)
	UpdateOrderStatus(c *gin.Context, in *types.UpdateOrderStatusRequest) error
	GetPrestationPricing(c *gin.Context, in *types.NoBody) (*settingstypes.PrestationPricing, error)
	UpdatePrestationPricing(c *gin.Context, in *settingstypes.UpdatePrestationPricingRequest) (*settingstypes.PrestationPricing, error)
}

type BackofficeController struct {
	uc usecase.IBackofficeUseCase
}

func NewBackofficeController(uc usecase.IBackofficeUseCase) IBackofficeController {
	return &BackofficeController{uc: uc}
}

func (ctrl *BackofficeController) GetDashboard(c *gin.Context, _ *types.NoBody) (*types.DashboardResponse, error) {
	return ctrl.uc.GetDashboard(c.Request.Context())
}

func (ctrl *BackofficeController) ListOrders(c *gin.Context, _ *types.NoBody) ([]types.RecentOrderEntry, error) {
	return ctrl.uc.ListOrders(c.Request.Context())
}

func (ctrl *BackofficeController) GetOrderDetail(c *gin.Context, in *types.OrderIDPath) (*types.OrderDetailResponse, error) {
	orderID, err := uuid.Parse(in.OrderID)
	if err != nil {
		return nil, fmt.Errorf("invalid order ID: %w", err)
	}
	return ctrl.uc.GetOrderDetail(c.Request.Context(), orderID)
}

func (ctrl *BackofficeController) ListClients(c *gin.Context, _ *types.NoBody) ([]types.ClientEntry, error) {
	return ctrl.uc.ListClients(c.Request.Context())
}

func (ctrl *BackofficeController) ListBookingDetails(c *gin.Context, _ *types.NoBody) ([]types.BookingDetailResponse, error) {
	return ctrl.uc.ListBookingDetails(c.Request.Context())
}

func (ctrl *BackofficeController) ListAllSlots(c *gin.Context, _ *types.NoBody) ([]types.AdminSlotResponse, error) {
	return ctrl.uc.ListAllSlots(c.Request.Context())
}

func (ctrl *BackofficeController) UpdateOrderStatus(c *gin.Context, in *types.UpdateOrderStatusRequest) error {
	orderID, err := uuid.Parse(in.OrderID)
	if err != nil {
		return fmt.Errorf("invalid order ID: %w", err)
	}
	return ctrl.uc.UpdateOrderStatus(c.Request.Context(), orderID, in.Status)
}

func (ctrl *BackofficeController) GetPrestationPricing(c *gin.Context, _ *types.NoBody) (*settingstypes.PrestationPricing, error) {
	return ctrl.uc.GetPrestationPricing(c.Request.Context())
}

func (ctrl *BackofficeController) UpdatePrestationPricing(c *gin.Context, in *settingstypes.UpdatePrestationPricingRequest) (*settingstypes.PrestationPricing, error) {
	return ctrl.uc.UpdatePrestationPricing(c.Request.Context(), in)
}

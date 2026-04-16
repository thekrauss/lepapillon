package checkout

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	panierrepo "github.com/thekrauss/lepapillon/internal/modules/panier/repository"
	"github.com/thekrauss/lepapillon/internal/modules/checkout/types"
	"github.com/thekrauss/lepapillon/internal/modules/checkout/usecase"
)

type ICheckoutController interface {
	CreateOrder(c *gin.Context, in *types.CreateOrderRequest) (*types.OrderResponse, error)
	GetOrder(c *gin.Context, in *types.OrderIDPath) (*types.OrderResponse, error)
	ListOrders(c *gin.Context, in *types.NoBody) ([]types.OrderResponse, error)
	ConfirmPayment(c *gin.Context, in *types.ConfirmPaymentRequest) (*types.OrderResponse, error)
}

type CheckoutController struct {
	uc         usecase.ICheckoutUseCase
	panierRepo panierrepo.PanierRepository
}

func NewCheckoutController(uc usecase.ICheckoutUseCase, panierRepo panierrepo.PanierRepository) ICheckoutController {
	return &CheckoutController{uc: uc, panierRepo: panierRepo}
}

func (ctrl *CheckoutController) CreateOrder(c *gin.Context, in *types.CreateOrderRequest) (*types.OrderResponse, error) {
	userID, err := extractUserUUID(c)
	if err != nil {
		return nil, err
	}
	// Load the current cart
	cart, err := ctrl.panierRepo.GetCart(c.Request.Context(), userID.String())
	if err != nil {
		return nil, err
	}
	return ctrl.uc.CreateOrder(c.Request.Context(), userID, cart, in)
}

func (ctrl *CheckoutController) GetOrder(c *gin.Context, in *types.OrderIDPath) (*types.OrderResponse, error) {
	userID, err := extractUserUUID(c)
	if err != nil {
		return nil, err
	}
	return ctrl.uc.GetOrder(c.Request.Context(), userID, in.OrderID)
}

func (ctrl *CheckoutController) ListOrders(c *gin.Context, _ *types.NoBody) ([]types.OrderResponse, error) {
	userID, err := extractUserUUID(c)
	if err != nil {
		return nil, err
	}
	orders, _, err := ctrl.uc.ListOrders(c.Request.Context(), userID, 20, 0)
	return orders, err
}

func (ctrl *CheckoutController) ConfirmPayment(c *gin.Context, in *types.ConfirmPaymentRequest) (*types.OrderResponse, error) {
	return ctrl.uc.ConfirmPayment(c.Request.Context(), in.OrderID, in.StripePaymentIntentID)
}

func extractUserUUID(c *gin.Context) (uuid.UUID, error) {
	raw, exists := c.Get("user_id")
	if !exists {
		return uuid.Nil, errors.New("user context missing")
	}
	switch v := raw.(type) {
	case string:
		return uuid.Parse(v)
	case uuid.UUID:
		return v, nil
	}
	return uuid.Nil, errors.New("invalid user context")
}

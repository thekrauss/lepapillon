package payment

import (
	"errors"
	"fmt"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	checkoutrepo "github.com/thekrauss/lepapillon/internal/modules/checkout/repository"
	"github.com/thekrauss/lepapillon/internal/modules/payment/services"
	"github.com/thekrauss/lepapillon/internal/modules/payment/types"
)

type IPaymentController interface {
	CreateIntent(c *gin.Context, in *types.CreateIntentRequest) (*types.IntentResponse, error)
	GetIntentStatus(c *gin.Context, in *types.OrderIDPath) (*types.IntentStatusResponse, error)
	RefundIntent(c *gin.Context, in *types.RefundRequest) (*types.RefundResponse, error)
}

type PaymentController struct {
	paymentSvc  services.Service
	orderRepo   checkoutrepo.CheckoutRepository
}

func NewPaymentController(paymentSvc services.Service, orderRepo checkoutrepo.CheckoutRepository) IPaymentController {
	return &PaymentController{paymentSvc: paymentSvc, orderRepo: orderRepo}
}

func (ctrl *PaymentController) CreateIntent(c *gin.Context, in *types.CreateIntentRequest) (*types.IntentResponse, error) {
	if ctrl.paymentSvc == nil {
		return nil, errors.New("payment service not configured")
	}

	// Load order to get the total
	order, err := ctrl.orderRepo.GetOrderByID(c.Request.Context(), in.OrderID)
	if err != nil {
		return nil, fmt.Errorf("order not found: %w", err)
	}

	// IDOR check: verify user owns this order
	userID, _ := c.Get("user_id")
	if uid, ok := userID.(string); ok {
		parsed, _ := uuid.Parse(uid)
		if order.UserID != parsed {
			return nil, errors.New("order not found")
		}
	}

	if order.StripePaymentIntentID != "" {
		// Intent already created — return existing
		status, err := ctrl.paymentSvc.GetIntent(order.StripePaymentIntentID)
		if err == nil {
			return &types.IntentResponse{
				IntentID:       status.IntentID,
				ClientSecret:   "", // Can't retrieve client_secret after creation
				PublishableKey: "", // Frontend already has it
				Status:         status.Status,
				Amount:         status.Amount,
			}, nil
		}
	}

	metadata := map[string]string{
		"order_id": order.ID.String(),
	}
	idempotencyKey := fmt.Sprintf("order:%s", order.ID.String())

	intent, err := ctrl.paymentSvc.CreateIntent(order.Total, "", metadata, idempotencyKey)
	if err != nil {
		return nil, err
	}

	// Store the intent ID on the order
	_ = ctrl.orderRepo.SetStripePaymentIntentID(c.Request.Context(), order.ID, intent.IntentID)

	return intent, nil
}

func (ctrl *PaymentController) GetIntentStatus(c *gin.Context, in *types.OrderIDPath) (*types.IntentStatusResponse, error) {
	if ctrl.paymentSvc == nil {
		return nil, errors.New("payment service not configured")
	}

	order, err := ctrl.orderRepo.GetOrderByID(c.Request.Context(), in.OrderID)
	if err != nil {
		return nil, err
	}
	if order.StripePaymentIntentID == "" {
		return &types.IntentStatusResponse{Status: "no_intent"}, nil
	}

	return ctrl.paymentSvc.GetIntent(order.StripePaymentIntentID)
}

func (ctrl *PaymentController) RefundIntent(c *gin.Context, in *types.RefundRequest) (*types.RefundResponse, error) {
	if ctrl.paymentSvc == nil {
		return nil, errors.New("payment service not configured")
	}

	order, err := ctrl.orderRepo.GetOrderByID(c.Request.Context(), in.OrderID)
	if err != nil {
		return nil, err
	}
	if order.StripePaymentIntentID == "" {
		return nil, errors.New("no payment intent on this order")
	}

	metadata := map[string]string{"order_id": order.ID.String()}
	return ctrl.paymentSvc.RefundIntent(order.StripePaymentIntentID, in.Amount, metadata)
}

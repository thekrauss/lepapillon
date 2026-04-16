package usecase

import (
	"context"
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	authdomain "github.com/thekrauss/lepapillon/internal/modules/auth/domain"
	"github.com/thekrauss/lepapillon/internal/infras/worker"
	"github.com/thekrauss/lepapillon/internal/modules/checkout/domain"
	"github.com/thekrauss/lepapillon/internal/modules/checkout/repository"
	"github.com/thekrauss/lepapillon/internal/modules/checkout/types"
	panierdomain "github.com/thekrauss/lepapillon/internal/modules/panier/domain"
	panierrepo "github.com/thekrauss/lepapillon/internal/modules/panier/repository"
	prestationdomain "github.com/thekrauss/lepapillon/internal/modules/prestation/domain"
	prestationrepo "github.com/thekrauss/lepapillon/internal/modules/prestation/repository"
)

var (
	ErrEmptyCart = errors.New("cart is empty")
)

type ICheckoutUseCase interface {
	CreateOrder(ctx context.Context, userID uuid.UUID, cart *panierdomain.Cart, req *types.CreateOrderRequest) (*types.OrderResponse, error)
	GetOrder(ctx context.Context, userID uuid.UUID, orderID uuid.UUID) (*types.OrderResponse, error)
	ListOrders(ctx context.Context, userID uuid.UUID, limit, offset int) ([]types.OrderResponse, int64, error)
	ConfirmPayment(ctx context.Context, orderID uuid.UUID, stripeIntentID string) (*types.OrderResponse, error)
}

type checkoutUseCase struct {
	repo           repository.CheckoutRepository
	panierRepo     panierrepo.PanierRepository
	userRepo       authdomain.UserRepository
	prestationRepo prestationrepo.PrestationRepository
	distributor    worker.TaskDistributor
	chefEmail      string
}

func NewCheckoutUseCase(repo repository.CheckoutRepository, panierRepo panierrepo.PanierRepository, userRepo authdomain.UserRepository, prestRepo prestationrepo.PrestationRepository, distributor worker.TaskDistributor, chefEmail string) ICheckoutUseCase {
	return &checkoutUseCase{repo: repo, panierRepo: panierRepo, userRepo: userRepo, prestationRepo: prestRepo, distributor: distributor, chefEmail: chefEmail}
}

// ── CreateOrder ─────────────────────────────────────────────────────

func (uc *checkoutUseCase) CreateOrder(ctx context.Context, userID uuid.UUID, cart *panierdomain.Cart, req *types.CreateOrderRequest) (*types.OrderResponse, error) {
	if cart == nil || len(cart.Items) == 0 {
		return nil, ErrEmptyCart
	}

	// Build order items from cart
	orderItems := make([]domain.OrderItem, len(cart.Items))
	for i, item := range cart.Items {
		orderItems[i] = domain.OrderItem{
			ID:          uuid.New(),
			ProductID:   item.ProductID,
			ProductName: item.ProductName,
			Price:       item.Price,
			Quantity:    item.Quantity,
		}
	}

	order := &domain.Order{
		ID:                 uuid.New(),
		UserID:             userID,
		Status:             domain.OrderStatusPending,
		ItemsTotal:         cart.ItemsTotal(),
		PrestationTotal:    cart.PrestationTotal(),
		Total:              cart.Total(),
		Notes:              req.Notes,
		DeliveryFirstName:  req.DeliveryFirstName,
		DeliveryLastName:   req.DeliveryLastName,
		DeliveryStreet:     req.DeliveryStreet,
		DeliveryCity:       req.DeliveryCity,
		DeliveryPostalCode: req.DeliveryPostalCode,
		DeliveryPhone:      req.DeliveryPhone,
		PickupCode:         generatePickupCode(),
		Items:              orderItems,
	}

	// If the cart has a prestation, create booking + order_prestation link
	if cart.Prestation != nil && uc.prestationRepo != nil {
		// Find the matching slot
		slots, _ := uc.prestationRepo.ListAvailableSlots(ctx, cart.Prestation.Date)
		var slotID uuid.UUID
		for _, s := range slots {
			if s.Date.Format("2006-01-02") == cart.Prestation.Date.Format("2006-01-02") &&
				s.TimeSlot == cart.Prestation.TimeSlot && s.IsAvailable {
				slotID = s.ID
				break
			}
		}

		// Create booking
		booking := &prestationdomain.PrestationBooking{
			ID:                uuid.New(),
			UserID:            userID,
			OrderID:           order.ID,
			SlotID:            slotID,
			AddressStreet:     cart.Prestation.Street,
			AddressCity:       cart.Prestation.City,
			AddressPostalCode: cart.Prestation.PostalCode,
			GuestCount:        cart.Prestation.GuestCount,
			Notes:             cart.Prestation.Notes,
			Status:            prestationdomain.BookingStatusConfirmed,
		}
		if err := uc.prestationRepo.CreateBooking(ctx, booking); err != nil {
			logrus.WithError(err).Warn("failed to create prestation booking")
		} else {
			// Mark slot as unavailable
			_ = uc.prestationRepo.BlockSlot(ctx, slotID)

			order.Prestation = &domain.OrderPrestation{
				ID:        uuid.New(),
				BookingID: booking.ID,
				Price:     cart.Prestation.Price,
			}
		}
	}

	if err := uc.repo.CreateOrder(ctx, order); err != nil {
		return nil, fmt.Errorf("create order: %w", err)
	}

	// Clear the cart after successful order creation
	_ = uc.panierRepo.DeleteCart(ctx, cart.UserID)

	logrus.WithFields(logrus.Fields{
		"order_id": order.ID,
		"user_id":  userID,
		"total":    order.Total,
		"items":    len(order.Items),
	}).Info("order created")

	// Enqueue async tasks
	if uc.distributor != nil {
		// Resolve user email for confirmation
		var userEmail string
		if user, err := uc.userRepo.GetByID(ctx, userID); err == nil {
			userEmail = user.Email
		}

		if userEmail != "" {
			totalEuros := fmt.Sprintf("%.2f €", float64(order.Total)/100)
			if err := uc.distributor.DistributeMailTask(ctx,
				[]string{userEmail},
				"Confirmation de commande — Saveurs Thaï",
				"order_confirmation",
				map[string]string{
					"order_id":    order.ID.String(),
					"pickup_code": order.PickupCode,
					"total":       totalEuros,
					"name":        req.DeliveryFirstName,
				},
			); err != nil {
				logrus.WithError(err).Warn("failed to enqueue order confirmation email")
			}
		}

		// Enqueue order status tracking task
		if err := uc.distributor.DistributeOrderStatusTask(ctx, order.ID.String(), "pending"); err != nil {
			logrus.WithError(err).Warn("failed to enqueue order status task")
		}

		// If prestation is included, notify the cheffe
		if cart.Prestation != nil {
			uc.enqueueChefNotification(ctx, order, cart.Prestation, req)
		}
	}

	return mapOrderResponse(order), nil
}

// ── GetOrder ────────────────────────────────────────────────────────

func (uc *checkoutUseCase) GetOrder(ctx context.Context, userID uuid.UUID, orderID uuid.UUID) (*types.OrderResponse, error) {
	order, err := uc.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	// IDOR prevention: user can only see their own orders
	if order.UserID != userID {
		return nil, errors.New("order not found")
	}
	return mapOrderResponse(order), nil
}

// ── ListOrders ──────────────────────────────────────────────────────

func (uc *checkoutUseCase) ListOrders(ctx context.Context, userID uuid.UUID, limit, offset int) ([]types.OrderResponse, int64, error) {
	orders, total, err := uc.repo.ListOrdersByUser(ctx, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	out := make([]types.OrderResponse, len(orders))
	for i := range orders {
		out[i] = *mapOrderResponse(&orders[i])
	}
	return out, total, nil
}

// ── ConfirmPayment ──────────────────────────────────────────────────

func (uc *checkoutUseCase) ConfirmPayment(ctx context.Context, orderID uuid.UUID, stripeIntentID string) (*types.OrderResponse, error) {
	if err := uc.repo.SetStripePaymentIntentID(ctx, orderID, stripeIntentID); err != nil {
		return nil, err
	}
	if err := uc.repo.UpdateOrderStatus(ctx, orderID, domain.OrderStatusPaid); err != nil {
		return nil, err
	}

	logrus.WithFields(logrus.Fields{
		"order_id":         orderID,
		"stripe_intent_id": stripeIntentID,
	}).Info("payment confirmed")

	order, err := uc.repo.GetOrderByID(ctx, orderID)
	if err != nil {
		return nil, err
	}
	return mapOrderResponse(order), nil
}

// ── helpers ─────────────────────────────────────────────────────────

func mapOrderResponse(o *domain.Order) *types.OrderResponse {
	items := make([]types.OrderItemResponse, len(o.Items))
	for i, item := range o.Items {
		items[i] = types.OrderItemResponse{
			ID:          item.ID,
			ProductID:   item.ProductID,
			ProductName: item.ProductName,
			Price:       item.Price,
			Quantity:    item.Quantity,
			Subtotal:    item.Price * int64(item.Quantity),
		}
	}
	resp := &types.OrderResponse{
		ID:              o.ID,
		Status:          o.Status,
		Items:           items,
		ItemsTotal:      o.ItemsTotal,
		PrestationTotal: o.PrestationTotal,
		Total:           o.Total,
		PickupCode:      o.PickupCode,
		Notes:           o.Notes,
		CreatedAt:       o.CreatedAt,
	}
	if o.Prestation != nil {
		resp.Prestation = &types.OrderPrestationResponse{
			BookingID: o.Prestation.BookingID,
			Price:     o.Prestation.Price,
		}
	}
	return resp
}

func generatePickupCode() string {
	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	code := make([]byte, 6)
	for i := range code {
		n, _ := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		code[i] = charset[n.Int64()]
	}
	return string(code)
}

// enqueueChefNotification sends an email to the cheffe with the prestation details
// and the list of products she needs to prepare.
func (uc *checkoutUseCase) enqueueChefNotification(ctx context.Context, order *domain.Order, prestation *panierdomain.PrestationOpt, req *types.CreateOrderRequest) {
	// Build product list for the cheffe
	var productList string
	for _, item := range order.Items {
		productList += fmt.Sprintf("- %s x%d\n", item.ProductName, item.Quantity)
	}

	totalEuros := fmt.Sprintf("%.2f €", float64(order.Total)/100)
	prestationEuros := fmt.Sprintf("%.2f €", float64(prestation.Price)/100)
	address := fmt.Sprintf("%s, %s %s", prestation.Street, prestation.PostalCode, prestation.City)

	chefEmail := uc.chefEmail
	if chefEmail == "" {
		chefEmail = "cheffe@saveursthai.fr"
	}

	if err := uc.distributor.DistributeMailTask(ctx,
		[]string{chefEmail},
		fmt.Sprintf("Nouvelle prestation — %s (%d convives)", prestation.Date.Format("02/01/2006"), prestation.GuestCount),
		"prestation_notification",
		map[string]string{
			"order_id":        order.ID.String(),
			"date":            prestation.Date.Format("02/01/2006"),
			"time_slot":       prestation.TimeSlot,
			"guest_count":     fmt.Sprintf("%d", prestation.GuestCount),
			"address":         address,
			"client_name":     req.DeliveryFirstName + " " + req.DeliveryLastName,
			"client_phone":    req.DeliveryPhone,
			"products":        productList,
			"total":           totalEuros,
			"prestation_price": prestationEuros,
			"notes":           prestation.Notes,
		},
	); err != nil {
		logrus.WithError(err).Warn("failed to enqueue cheffe notification email")
	}
}

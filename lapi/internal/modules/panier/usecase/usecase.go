package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	cataloguerepo "github.com/thekrauss/lepapillon/internal/modules/catalogue/repository"
	"github.com/thekrauss/lepapillon/internal/modules/panier/domain"
	"github.com/thekrauss/lepapillon/internal/modules/panier/repository"
	"github.com/thekrauss/lepapillon/internal/modules/panier/types"
	settingssvc "github.com/thekrauss/lepapillon/internal/modules/settings"
)

var (
	ErrProductNotFound  = errors.New("product not found")
	ErrOutOfStock       = errors.New("product out of stock")
	ErrCartEmpty        = errors.New("cart is empty")
	ErrItemNotInCart    = errors.New("item not in cart")
	ErrGuestCountLimit = errors.New("guest count exceeds maximum")
)

// IPanierUseCase defines the business logic for the shopping cart.
type IPanierUseCase interface {
	GetCart(ctx context.Context, userID string) (*types.CartResponse, error)
	AddItem(ctx context.Context, userID string, req *types.AddItemRequest) (*types.CartResponse, error)
	UpdateItem(ctx context.Context, userID string, req *types.UpdateItemRequest) (*types.CartResponse, error)
	RemoveItem(ctx context.Context, userID string, productID uuid.UUID) (*types.CartResponse, error)
	SetPrestation(ctx context.Context, userID string, req *types.SetPrestationRequest) (*types.CartResponse, error)
	RemovePrestation(ctx context.Context, userID string) (*types.CartResponse, error)
	ClearCart(ctx context.Context, userID string) error
}

type panierUseCase struct {
	repo      repository.PanierRepository
	catalogue cataloguerepo.CatalogueRepository
	settings  settingssvc.Service
}

func NewPanierUseCase(repo repository.PanierRepository, catalogue cataloguerepo.CatalogueRepository, settings settingssvc.Service) IPanierUseCase {
	return &panierUseCase{repo: repo, catalogue: catalogue, settings: settings}
}

// ── GetCart ──────────────────────────────────────────────────────────

func (uc *panierUseCase) GetCart(ctx context.Context, userID string) (*types.CartResponse, error) {
	cart, err := uc.repo.GetCart(ctx, userID)
	if err != nil {
		return nil, err
	}
	return mapCartResponse(cart), nil
}

// ── AddItem ─────────────────────────────────────────────────────────

func (uc *panierUseCase) AddItem(ctx context.Context, userID string, req *types.AddItemRequest) (*types.CartResponse, error) {
	product, err := uc.catalogue.GetProductByID(ctx, req.ProductID)
	if err != nil {
		return nil, ErrProductNotFound
	}
	if !product.IsActive {
		return nil, ErrProductNotFound
	}
	if product.Stock < req.Quantity {
		return nil, ErrOutOfStock
	}

	cart, err := uc.repo.GetCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	found := false
	for i, item := range cart.Items {
		if item.ProductID == req.ProductID {
			cart.Items[i].Quantity += req.Quantity
			cart.Items[i].Price = product.Price
			cart.Items[i].ProductName = product.Name
			cart.Items[i].ImageURL = product.ImageURL
			found = true
			break
		}
	}

	if !found {
		cart.Items = append(cart.Items, domain.CartItem{
			ProductID:   product.ID,
			ProductName: product.Name,
			Price:       product.Price,
			Quantity:    req.Quantity,
			ImageURL:    product.ImageURL,
		})
	}

	if err := uc.repo.SaveCart(ctx, cart); err != nil {
		return nil, err
	}

	logrus.WithFields(logrus.Fields{
		"user_id":    userID,
		"product_id": req.ProductID,
		"quantity":   req.Quantity,
	}).Info("item added to cart")

	return mapCartResponse(cart), nil
}

// ── UpdateItem ──────────────────────────────────────────────────────

func (uc *panierUseCase) UpdateItem(ctx context.Context, userID string, req *types.UpdateItemRequest) (*types.CartResponse, error) {
	cart, err := uc.repo.GetCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	found := false
	for i, item := range cart.Items {
		if item.ProductID == req.ProductID {
			product, err := uc.catalogue.GetProductByID(ctx, req.ProductID)
			if err != nil {
				return nil, ErrProductNotFound
			}
			if product.Stock < req.Quantity {
				return nil, ErrOutOfStock
			}
			cart.Items[i].Quantity = req.Quantity
			cart.Items[i].Price = product.Price
			found = true
			break
		}
	}

	if !found {
		return nil, ErrItemNotInCart
	}

	if err := uc.repo.SaveCart(ctx, cart); err != nil {
		return nil, err
	}
	return mapCartResponse(cart), nil
}

// ── RemoveItem ──────────────────────────────────────────────────────

func (uc *panierUseCase) RemoveItem(ctx context.Context, userID string, productID uuid.UUID) (*types.CartResponse, error) {
	cart, err := uc.repo.GetCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	filtered := make([]domain.CartItem, 0, len(cart.Items))
	found := false
	for _, item := range cart.Items {
		if item.ProductID == productID {
			found = true
			continue
		}
		filtered = append(filtered, item)
	}

	if !found {
		return nil, ErrItemNotInCart
	}

	cart.Items = filtered
	if err := uc.repo.SaveCart(ctx, cart); err != nil {
		return nil, err
	}
	return mapCartResponse(cart), nil
}

// ── SetPrestation ───────────────────────────────────────────────────

func (uc *panierUseCase) SetPrestation(ctx context.Context, userID string, req *types.SetPrestationRequest) (*types.CartResponse, error) {
	cart, err := uc.repo.GetCart(ctx, userID)
	if err != nil {
		return nil, err
	}

	if len(cart.Items) == 0 {
		return nil, ErrCartEmpty
	}

	// Fetch dynamic pricing from settings (configured by the cheffe in backoffice)
	pricing, err := uc.settings.GetPrestationPricing(ctx)
	if err != nil {
		return nil, fmt.Errorf("load prestation pricing: %w", err)
	}
	if req.GuestCount < pricing.MinGuests || req.GuestCount > pricing.MaxGuests {
		return nil, ErrGuestCountLimit
	}
	price := pricing.Calculate(req.GuestCount)

	cart.Prestation = &domain.PrestationOpt{
		Date:       req.Date,
		TimeSlot:   req.TimeSlot,
		Street:     req.Street,
		City:       req.City,
		PostalCode: req.PostalCode,
		GuestCount: req.GuestCount,
		Notes:      req.Notes,
		Price:      price,
	}

	if err := uc.repo.SaveCart(ctx, cart); err != nil {
		return nil, err
	}

	logrus.WithFields(logrus.Fields{
		"user_id":     userID,
		"date":        req.Date,
		"guest_count": req.GuestCount,
	}).Info("prestation added to cart")

	return mapCartResponse(cart), nil
}

// ── RemovePrestation ────────────────────────────────────────────────

func (uc *panierUseCase) RemovePrestation(ctx context.Context, userID string) (*types.CartResponse, error) {
	cart, err := uc.repo.GetCart(ctx, userID)
	if err != nil {
		return nil, err
	}
	cart.Prestation = nil
	if err := uc.repo.SaveCart(ctx, cart); err != nil {
		return nil, err
	}
	return mapCartResponse(cart), nil
}

// ── ClearCart ────────────────────────────────────────────────────────

func (uc *panierUseCase) ClearCart(ctx context.Context, userID string) error {
	return uc.repo.DeleteCart(ctx, userID)
}

// ── helpers ─────────────────────────────────────────────────────────

func mapCartResponse(cart *domain.Cart) *types.CartResponse {
	items := make([]types.CartItemResponse, len(cart.Items))
	for i, item := range cart.Items {
		items[i] = types.CartItemResponse{
			ProductID:   item.ProductID,
			ProductName: item.ProductName,
			Price:       item.Price,
			Quantity:    item.Quantity,
			ImageURL:    item.ImageURL,
			Subtotal:    item.Price * int64(item.Quantity),
		}
	}

	resp := &types.CartResponse{
		Items:           items,
		ItemsTotal:      cart.ItemsTotal(),
		PrestationTotal: cart.PrestationTotal(),
		Total:           cart.Total(),
		ItemCount:       len(cart.Items),
	}

	if cart.Prestation != nil {
		resp.Prestation = &types.PrestationOptResponse{
			Date:       cart.Prestation.Date,
			TimeSlot:   cart.Prestation.TimeSlot,
			Street:     cart.Prestation.Street,
			City:       cart.Prestation.City,
			PostalCode: cart.Prestation.PostalCode,
			GuestCount: cart.Prestation.GuestCount,
			Notes:      cart.Prestation.Notes,
			Price:      cart.Prestation.Price,
		}
	}

	return resp
}

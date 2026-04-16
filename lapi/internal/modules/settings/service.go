package settings

import (
	"context"

	"github.com/thekrauss/lepapillon/internal/modules/settings/repository"
	"github.com/thekrauss/lepapillon/internal/modules/settings/types"
)

const keyPrestationPricing = "prestation_pricing"

// Service exposes settings operations.
type Service interface {
	GetPrestationPricing(ctx context.Context) (*types.PrestationPricing, error)
	UpdatePrestationPricing(ctx context.Context, req *types.UpdatePrestationPricingRequest) (*types.PrestationPricing, error)
}

type service struct {
	repo repository.SettingsRepository
}

func NewService(repo repository.SettingsRepository) Service {
	return &service{repo: repo}
}

// Default pricing if nothing in DB yet.
var defaultPricing = types.PrestationPricing{
	BasePrice:      5000, // 50 €
	PricePerPerson: 1500, // 15 €
	MinGuests:      2,
	MaxGuests:      12,
}

func (s *service) GetPrestationPricing(ctx context.Context) (*types.PrestationPricing, error) {
	var pricing types.PrestationPricing
	if err := s.repo.Get(ctx, keyPrestationPricing, &pricing); err != nil {
		// Return defaults if not configured yet
		p := defaultPricing
		return &p, nil
	}
	return &pricing, nil
}

func (s *service) UpdatePrestationPricing(ctx context.Context, req *types.UpdatePrestationPricingRequest) (*types.PrestationPricing, error) {
	current, _ := s.GetPrestationPricing(ctx)

	if req.BasePrice != nil {
		current.BasePrice = *req.BasePrice
	}
	if req.PricePerPerson != nil {
		current.PricePerPerson = *req.PricePerPerson
	}
	if req.MinGuests != nil {
		current.MinGuests = *req.MinGuests
	}
	if req.MaxGuests != nil {
		current.MaxGuests = *req.MaxGuests
	}

	if err := s.repo.Set(ctx, keyPrestationPricing, current); err != nil {
		return nil, err
	}
	return current, nil
}

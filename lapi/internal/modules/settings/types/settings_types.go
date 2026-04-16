package types

// PrestationPricing holds the cheffe's configurable pricing (Option B).
type PrestationPricing struct {
	BasePrice      int64 `json:"base_price"`       // centimes
	PricePerPerson int64 `json:"price_per_person"`  // centimes
	MinGuests      int   `json:"min_guests"`
	MaxGuests      int   `json:"max_guests"`
}

// Calculate returns the total prestation price in centimes for the given guest count.
func (p PrestationPricing) Calculate(guests int) int64 {
	if guests < p.MinGuests {
		guests = p.MinGuests
	}
	return p.BasePrice + int64(guests)*p.PricePerPerson
}

// MinPrice returns the starting price for display ("à partir de X €").
func (p PrestationPricing) MinPrice() int64 {
	return p.Calculate(p.MinGuests)
}

// UpdatePrestationPricingRequest is the admin input for updating pricing.
type UpdatePrestationPricingRequest struct {
	BasePrice      *int64 `json:"base_price" validate:"omitempty,min=0"`
	PricePerPerson *int64 `json:"price_per_person" validate:"omitempty,min=0"`
	MinGuests      *int   `json:"min_guests" validate:"omitempty,min=1,max=20"`
	MaxGuests      *int   `json:"max_guests" validate:"omitempty,min=1,max=50"`
}

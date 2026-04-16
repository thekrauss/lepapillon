package usecase

import (
	"github.com/thekrauss/lepapillon/internal/modules/catalogue/domain"
	"github.com/thekrauss/lepapillon/internal/modules/catalogue/types"
)

func mapProductResponse(p domain.Product) types.ProductResponse {
	resp := types.ProductResponse{
		ID:              p.ID,
		Name:            p.Name,
		Slug:            p.Slug,
		Description:     p.Description,
		Price:           p.Price,
		ImageURL:        p.ImageURL,
		Stock:           p.Stock,
		IsActive:        p.IsActive,
		IsFeatured:      p.IsFeatured,
		IsKit:           p.IsKit,
		PrepTimeMinutes: p.PrepTimeMinutes,
	}
	if p.Category != nil {
		cat := mapCategoryResponse(*p.Category)
		resp.Category = &cat
	}
	return resp
}

func mapCategoryResponse(c domain.Category) types.CategoryResponse {
	return types.CategoryResponse{
		ID:          c.ID,
		Name:        c.Name,
		Slug:        c.Slug,
		Description: c.Description,
		ImageURL:    c.ImageURL,
		Position:    c.Position,
		IsActive:    c.IsActive,
	}
}

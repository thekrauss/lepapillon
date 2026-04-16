package usecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/thekrauss/lepapillon/internal/modules/catalogue/domain"
	"github.com/thekrauss/lepapillon/internal/modules/catalogue/types"
)

func (uc *catalogueUseCase) CreateProduct(ctx context.Context, req *types.CreateProductRequest) (*types.ProductResponse, error) {
	product := &domain.Product{
		ID:              uuid.New(),
		CategoryID:      req.CategoryID,
		Name:            req.Name,
		Slug:            req.Slug,
		Description:     req.Description,
		Price:           req.Price,
		ImageURL:        req.ImageURL,
		Stock:           req.Stock,
		IsActive:        true,
		IsKit:           req.IsKit,
		PrepTimeMinutes: req.PrepTimeMinutes,
	}
	if err := uc.repo.CreateProduct(ctx, product); err != nil {
		return nil, err
	}
	// Reload with category preloaded
	created, err := uc.repo.GetProductByID(ctx, product.ID)
	if err != nil {
		resp := mapProductResponse(*product)
		return &resp, nil
	}
	resp := mapProductResponse(*created)
	return &resp, nil
}

func (uc *catalogueUseCase) UpdateProduct(ctx context.Context, id uuid.UUID, req *types.UpdateProductRequest) (*types.ProductResponse, error) {
	product, err := uc.repo.GetProductByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.Description != nil {
		product.Description = *req.Description
	}
	if req.Price != nil {
		product.Price = *req.Price
	}
	if req.ImageURL != nil {
		product.ImageURL = *req.ImageURL
	}
	if req.Stock != nil {
		product.Stock = *req.Stock
	}
	if req.IsActive != nil {
		product.IsActive = *req.IsActive
	}
	if req.IsFeatured != nil {
		product.IsFeatured = *req.IsFeatured
	}
	if req.IsKit != nil {
		product.IsKit = *req.IsKit
	}
	if req.PrepTimeMinutes != nil {
		product.PrepTimeMinutes = req.PrepTimeMinutes
	}
	if err := uc.repo.UpdateProduct(ctx, product); err != nil {
		return nil, err
	}
	resp := mapProductResponse(*product)
	return &resp, nil
}

func (uc *catalogueUseCase) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	return uc.repo.DeleteProduct(ctx, id)
}

func (uc *catalogueUseCase) CreateCategory(ctx context.Context, req *types.CreateCategoryRequest) (*types.CategoryResponse, error) {
	cat := &domain.Category{
		ID:          uuid.New(),
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		ImageURL:    req.ImageURL,
		Position:    req.Position,
		IsActive:    true,
	}
	if err := uc.repo.CreateCategory(ctx, cat); err != nil {
		return nil, err
	}
	resp := mapCategoryResponse(*cat)
	return &resp, nil
}

func (uc *catalogueUseCase) UpdateCategory(ctx context.Context, id uuid.UUID, req *types.UpdateCategoryRequest) (*types.CategoryResponse, error) {
	cat, err := uc.repo.GetCategoryByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if req.Name != nil {
		cat.Name = *req.Name
	}
	if req.Description != nil {
		cat.Description = *req.Description
	}
	if req.ImageURL != nil {
		cat.ImageURL = *req.ImageURL
	}
	if req.Position != nil {
		cat.Position = *req.Position
	}
	if req.IsActive != nil {
		cat.IsActive = *req.IsActive
	}
	if err := uc.repo.UpdateCategory(ctx, cat); err != nil {
		return nil, err
	}
	resp := mapCategoryResponse(*cat)
	return &resp, nil
}

func (uc *catalogueUseCase) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	return uc.repo.DeleteCategory(ctx, id)
}

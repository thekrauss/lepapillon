package usecase

import (
	"context"

	"github.com/thekrauss/lepapillon/internal/modules/catalogue/repository"
	"github.com/thekrauss/lepapillon/internal/modules/catalogue/types"
)

func (uc *catalogueUseCase) ListCategories(ctx context.Context) ([]types.CategoryResponse, error) {
	cats, err := uc.repo.ListCategories(ctx)
	if err != nil {
		return nil, err
	}
	out := make([]types.CategoryResponse, len(cats))
	for i, c := range cats {
		out[i] = mapCategoryResponse(c)
	}
	return out, nil
}

func (uc *catalogueUseCase) GetCategoryBySlug(ctx context.Context, slug string) (*types.CategoryResponse, error) {
	c, err := uc.repo.GetCategoryBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	resp := mapCategoryResponse(*c)
	return &resp, nil
}

func (uc *catalogueUseCase) ListProducts(ctx context.Context, filter repository.ProductListFilter) ([]types.ProductResponse, int64, error) {
	products, total, err := uc.repo.ListProducts(ctx, filter)
	if err != nil {
		return nil, 0, err
	}
	out := make([]types.ProductResponse, len(products))
	for i, p := range products {
		out[i] = mapProductResponse(p)
	}
	return out, total, nil
}

func (uc *catalogueUseCase) GetProductBySlug(ctx context.Context, slug string) (*types.ProductResponse, error) {
	p, err := uc.repo.GetProductBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	resp := mapProductResponse(*p)
	return &resp, nil
}

func (uc *catalogueUseCase) ListFeaturedProducts(ctx context.Context, limit int) ([]types.ProductResponse, error) {
	products, err := uc.repo.ListFeaturedProducts(ctx, limit)
	if err != nil {
		return nil, err
	}
	out := make([]types.ProductResponse, len(products))
	for i, p := range products {
		out[i] = mapProductResponse(p)
	}
	return out, nil
}

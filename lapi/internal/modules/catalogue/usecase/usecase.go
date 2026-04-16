package usecase

import (
	"context"

	"github.com/google/uuid"
	"github.com/thekrauss/lepapillon/internal/modules/catalogue/repository"
	"github.com/thekrauss/lepapillon/internal/modules/catalogue/types"
)

type ICatalogueUseCase interface {
	ListCategories(ctx context.Context) ([]types.CategoryResponse, error)
	GetCategoryBySlug(ctx context.Context, slug string) (*types.CategoryResponse, error)
	ListProducts(ctx context.Context, filter repository.ProductListFilter) ([]types.ProductResponse, int64, error)
	GetProductBySlug(ctx context.Context, slug string) (*types.ProductResponse, error)
	ListFeaturedProducts(ctx context.Context, limit int) ([]types.ProductResponse, error)
	CreateProduct(ctx context.Context, req *types.CreateProductRequest) (*types.ProductResponse, error)
	UpdateProduct(ctx context.Context, id uuid.UUID, req *types.UpdateProductRequest) (*types.ProductResponse, error)
	DeleteProduct(ctx context.Context, id uuid.UUID) error
	CreateCategory(ctx context.Context, req *types.CreateCategoryRequest) (*types.CategoryResponse, error)
	UpdateCategory(ctx context.Context, id uuid.UUID, req *types.UpdateCategoryRequest) (*types.CategoryResponse, error)
	DeleteCategory(ctx context.Context, id uuid.UUID) error
}

type catalogueUseCase struct {
	repo repository.CatalogueRepository
}

func NewCatalogueUseCase(repo repository.CatalogueRepository) ICatalogueUseCase {
	return &catalogueUseCase{repo: repo}
}

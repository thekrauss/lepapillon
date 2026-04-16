package catalogue

import (
	"github.com/gin-gonic/gin"
	"github.com/thekrauss/lepapillon/internal/modules/catalogue/repository"
	"github.com/thekrauss/lepapillon/internal/modules/catalogue/types"
	"github.com/thekrauss/lepapillon/internal/modules/catalogue/usecase"
)

// ICatalogueController — tonic-style signatures for fizz/tonic route registration.
type ICatalogueController interface {
	ListCategories(c *gin.Context, in *types.NoBody) ([]types.CategoryResponse, error)
	GetCategory(c *gin.Context, in *types.CategoryBySlugInput) (*types.CategoryResponse, error)
	ListProducts(c *gin.Context, in *types.ProductListInput) ([]types.ProductResponse, error)
	GetProduct(c *gin.Context, in *types.ProductBySlugInput) (*types.ProductResponse, error)
	CreateProduct(c *gin.Context, in *types.CreateProductInput) (*types.ProductResponse, error)
	UpdateProduct(c *gin.Context, in *types.UpdateProductInput) (*types.ProductResponse, error)
	DeleteProduct(c *gin.Context, in *types.DeleteProductInput) error
	CreateCategory(c *gin.Context, in *types.CreateCategoryInput) (*types.CategoryResponse, error)
	UpdateCategory(c *gin.Context, in *types.UpdateCategoryInput) (*types.CategoryResponse, error)
	DeleteCategory(c *gin.Context, in *types.DeleteCategoryInput) error
}

type CatalogueController struct {
	uc usecase.ICatalogueUseCase
}

func NewCatalogueController(uc usecase.ICatalogueUseCase) ICatalogueController {
	return &CatalogueController{uc: uc}
}

// ── Categories ──────────────────────────────────────────────────────

func (ctrl *CatalogueController) ListCategories(c *gin.Context, _ *types.NoBody) ([]types.CategoryResponse, error) {
	return ctrl.uc.ListCategories(c.Request.Context())
}

func (ctrl *CatalogueController) GetCategory(c *gin.Context, in *types.CategoryBySlugInput) (*types.CategoryResponse, error) {
	return ctrl.uc.GetCategoryBySlug(c.Request.Context(), in.Slug)
}

// ── Products ────────────────────────────────────────────────────────

func (ctrl *CatalogueController) ListProducts(c *gin.Context, in *types.ProductListInput) ([]types.ProductResponse, error) {
	// Build filter from query params
	filter := repository.ProductListFilter{
		ActiveOnly: true,
		Limit:      in.Limit,
		Offset:     in.Offset,
		Featured:   in.Featured,
		Kit:        in.Kit,
	}

	// Resolve category slug → ID if provided
	if in.CategorySlug != "" {
		cat, err := ctrl.uc.GetCategoryBySlug(c.Request.Context(), in.CategorySlug)
		if err != nil {
			return nil, err
		}
		filter.CategoryID = &cat.ID
	}

	products, _, err := ctrl.uc.ListProducts(c.Request.Context(), filter)
	return products, err
}

func (ctrl *CatalogueController) GetProduct(c *gin.Context, in *types.ProductBySlugInput) (*types.ProductResponse, error) {
	return ctrl.uc.GetProductBySlug(c.Request.Context(), in.Slug)
}

// ── Admin: Products CRUD ────────────────────────────────────────────

func (ctrl *CatalogueController) CreateProduct(c *gin.Context, in *types.CreateProductInput) (*types.ProductResponse, error) {
	return ctrl.uc.CreateProduct(c.Request.Context(), &in.CreateProductRequest)
}

func (ctrl *CatalogueController) UpdateProduct(c *gin.Context, in *types.UpdateProductInput) (*types.ProductResponse, error) {
	return ctrl.uc.UpdateProduct(c.Request.Context(), in.ID, &in.UpdateProductRequest)
}

func (ctrl *CatalogueController) DeleteProduct(c *gin.Context, in *types.DeleteProductInput) error {
	return ctrl.uc.DeleteProduct(c.Request.Context(), in.ID)
}

// ── Admin: Categories CRUD ──────────────────────────────────────────

func (ctrl *CatalogueController) CreateCategory(c *gin.Context, in *types.CreateCategoryInput) (*types.CategoryResponse, error) {
	return ctrl.uc.CreateCategory(c.Request.Context(), &in.CreateCategoryRequest)
}

func (ctrl *CatalogueController) UpdateCategory(c *gin.Context, in *types.UpdateCategoryInput) (*types.CategoryResponse, error) {
	return ctrl.uc.UpdateCategory(c.Request.Context(), in.ID, &in.UpdateCategoryRequest)
}

func (ctrl *CatalogueController) DeleteCategory(c *gin.Context, in *types.DeleteCategoryInput) error {
	return ctrl.uc.DeleteCategory(c.Request.Context(), in.ID)
}

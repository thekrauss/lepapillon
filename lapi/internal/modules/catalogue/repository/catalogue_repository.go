package repository

import (
	"context"

	"github.com/google/uuid"
	"github.com/thekrauss/lepapillon/internal/modules/catalogue/domain"
	"gorm.io/gorm"
)

type ProductListFilter struct {
	CategoryID *uuid.UUID
	Featured   *bool
	Kit        *bool
	ActiveOnly bool
	Limit      int
	Offset     int
}

type CatalogueRepository interface {
	ListCategories(ctx context.Context) ([]domain.Category, error)
	GetCategoryByID(ctx context.Context, id uuid.UUID) (*domain.Category, error)
	GetCategoryBySlug(ctx context.Context, slug string) (*domain.Category, error)
	ListProducts(ctx context.Context, filter ProductListFilter) ([]domain.Product, int64, error)
	GetProductBySlug(ctx context.Context, slug string) (*domain.Product, error)
	GetProductByID(ctx context.Context, id uuid.UUID) (*domain.Product, error)
	ListFeaturedProducts(ctx context.Context, limit int) ([]domain.Product, error)
	CreateProduct(ctx context.Context, product *domain.Product) error
	UpdateProduct(ctx context.Context, product *domain.Product) error
	DeleteProduct(ctx context.Context, id uuid.UUID) error
	CreateCategory(ctx context.Context, cat *domain.Category) error
	UpdateCategory(ctx context.Context, cat *domain.Category) error
	DeleteCategory(ctx context.Context, id uuid.UUID) error
}

type catalogueRepository struct {
	db *gorm.DB
}

func NewCatalogueRepository(db *gorm.DB) CatalogueRepository {
	return &catalogueRepository{db: db}
}

func (r *catalogueRepository) ListCategories(ctx context.Context) ([]domain.Category, error) {
	var cats []domain.Category
	err := r.db.WithContext(ctx).Where("is_active = ?", true).Order("position ASC").Find(&cats).Error
	return cats, err
}

func (r *catalogueRepository) GetCategoryByID(ctx context.Context, id uuid.UUID) (*domain.Category, error) {
	var cat domain.Category
	err := r.db.WithContext(ctx).First(&cat, "id = ?", id).Error
	return &cat, err
}

func (r *catalogueRepository) GetCategoryBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	var cat domain.Category
	err := r.db.WithContext(ctx).Where("slug = ?", slug).First(&cat).Error
	return &cat, err
}

func (r *catalogueRepository) ListProducts(ctx context.Context, filter ProductListFilter) ([]domain.Product, int64, error) {
	var products []domain.Product
	var total int64

	q := r.db.WithContext(ctx).Model(&domain.Product{})
	if filter.ActiveOnly {
		q = q.Where("is_active = ?", true)
	}
	if filter.CategoryID != nil {
		q = q.Where("category_id = ?", *filter.CategoryID)
	}
	if filter.Featured != nil {
		q = q.Where("is_featured = ?", *filter.Featured)
	}
	if filter.Kit != nil {
		q = q.Where("is_kit = ?", *filter.Kit)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	limit := filter.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	q = q.Preload("Category").Order("created_at DESC").Limit(limit).Offset(filter.Offset)

	err := q.Find(&products).Error
	return products, total, err
}

func (r *catalogueRepository) ListFeaturedProducts(ctx context.Context, limit int) ([]domain.Product, error) {
	if limit <= 0 {
		limit = 8
	}
	var products []domain.Product
	err := r.db.WithContext(ctx).
		Where("is_active = ? AND is_featured = ?", true, true).
		Preload("Category").
		Order("created_at DESC").
		Limit(limit).
		Find(&products).Error
	return products, err
}

func (r *catalogueRepository) GetProductBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	var product domain.Product
	err := r.db.WithContext(ctx).Preload("Category").Where("slug = ?", slug).First(&product).Error
	return &product, err
}

func (r *catalogueRepository) GetProductByID(ctx context.Context, id uuid.UUID) (*domain.Product, error) {
	var product domain.Product
	err := r.db.WithContext(ctx).Preload("Category").First(&product, "id = ?", id).Error
	return &product, err
}

func (r *catalogueRepository) CreateProduct(ctx context.Context, product *domain.Product) error {
	return r.db.WithContext(ctx).Create(product).Error
}

func (r *catalogueRepository) UpdateProduct(ctx context.Context, product *domain.Product) error {
	return r.db.WithContext(ctx).Save(product).Error
}

func (r *catalogueRepository) DeleteProduct(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&domain.Product{}, "id = ?", id).Error
}

func (r *catalogueRepository) CreateCategory(ctx context.Context, cat *domain.Category) error {
	return r.db.WithContext(ctx).Create(cat).Error
}

func (r *catalogueRepository) UpdateCategory(ctx context.Context, cat *domain.Category) error {
	return r.db.WithContext(ctx).Save(cat).Error
}

func (r *catalogueRepository) DeleteCategory(ctx context.Context, id uuid.UUID) error {
	return r.db.WithContext(ctx).Delete(&domain.Category{}, "id = ?", id).Error
}

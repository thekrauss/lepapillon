package types

import "github.com/google/uuid"

// NoBody is used for tonic handlers that take no request body.
type NoBody struct{}

// ── Path params ─────────────────────────────────────────────────────

type SlugPath struct {
	Slug string `path:"slug"`
}

type IDPath struct {
	ID uuid.UUID `path:"id"`
}

// ── Query params ────────────────────────────────────────────────────

type ProductListQuery struct {
	CategorySlug string `query:"category" validate:"omitempty"`
	Featured     *bool  `query:"featured" validate:"omitempty"`
	Kit          *bool  `query:"kit" validate:"omitempty"`
	Limit        int    `query:"limit" validate:"omitempty,min=1,max=100"`
	Offset       int    `query:"offset" validate:"omitempty,min=0"`
}

// ── Composed inputs (path + query or path + body) ───────────────────

type ProductListInput struct {
	ProductListQuery
}

type ProductBySlugInput struct {
	SlugPath
}

type CategoryBySlugInput struct {
	SlugPath
}

type CreateProductInput struct {
	CreateProductRequest
}

type UpdateProductInput struct {
	IDPath
	UpdateProductRequest
}

type DeleteProductInput struct {
	IDPath
}

type CreateCategoryInput struct {
	CreateCategoryRequest
}

type UpdateCategoryInput struct {
	IDPath
	UpdateCategoryRequest
}

type DeleteCategoryInput struct {
	IDPath
}

// ── Request DTOs ────────────────────────────────────────────────────

type CreateProductRequest struct {
	Name            string    `json:"name" validate:"required,min=2,max=200"`
	Slug            string    `json:"slug" validate:"required,min=2,max=200"`
	Description     string    `json:"description"`
	Price           int64     `json:"price" validate:"required,gt=0"` // centimes
	CategoryID      uuid.UUID `json:"category_id" validate:"required"`
	ImageURL        string    `json:"image_url" validate:"omitempty,url"`
	Stock           int       `json:"stock" validate:"omitempty,min=0"`
	IsKit           bool      `json:"is_kit"`
	PrepTimeMinutes *int      `json:"prep_time_minutes" validate:"omitempty,min=1"`
}

type UpdateProductRequest struct {
	Name            *string `json:"name,omitempty" validate:"omitempty,min=2,max=200"`
	Description     *string `json:"description,omitempty"`
	Price           *int64  `json:"price,omitempty" validate:"omitempty,gt=0"`
	ImageURL        *string `json:"image_url,omitempty"`
	Stock           *int    `json:"stock,omitempty" validate:"omitempty,min=0"`
	IsActive        *bool   `json:"is_active,omitempty"`
	IsFeatured      *bool   `json:"is_featured,omitempty"`
	IsKit           *bool   `json:"is_kit,omitempty"`
	PrepTimeMinutes *int    `json:"prep_time_minutes,omitempty"`
}

type CreateCategoryRequest struct {
	Name        string `json:"name" validate:"required,min=2,max=100"`
	Slug        string `json:"slug" validate:"required,min=2,max=100"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url" validate:"omitempty,url"`
	Position    int    `json:"position"`
}

type UpdateCategoryRequest struct {
	Name        *string `json:"name,omitempty" validate:"omitempty,min=2,max=100"`
	Description *string `json:"description,omitempty"`
	ImageURL    *string `json:"image_url,omitempty"`
	Position    *int    `json:"position,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
}

// ── Response DTOs ───────────────────────────────────────────────────

type ProductResponse struct {
	ID              uuid.UUID         `json:"id"`
	Name            string            `json:"name"`
	Slug            string            `json:"slug"`
	Description     string            `json:"description"`
	Price           int64             `json:"price"`
	ImageURL        string            `json:"image_url"`
	Stock           int               `json:"stock"`
	IsActive        bool              `json:"is_active"`
	IsFeatured      bool              `json:"is_featured"`
	IsKit           bool              `json:"is_kit"`
	PrepTimeMinutes *int              `json:"prep_time_minutes,omitempty"`
	Category        *CategoryResponse `json:"category,omitempty"`
}

type CategoryResponse struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Slug        string    `json:"slug"`
	Description string    `json:"description"`
	ImageURL    string    `json:"image_url"`
	Position    int       `json:"position"`
	IsActive    bool      `json:"is_active"`
}

type CategoryWithProductsResponse struct {
	CategoryResponse
	Products []ProductResponse `json:"products"`
}

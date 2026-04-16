package domain

import "math"

type PaginationParams struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
}

func NewPaginationParams(page, limit int) PaginationParams {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return PaginationParams{Page: page, Limit: limit}
}

func (p PaginationParams) Offset() int {
	return (p.Page - 1) * p.Limit
}

type PaginatedResult[T any] struct {
	Items      []T   `json:"items"`
	Total      int64 `json:"total"`
	Page       int   `json:"page"`
	TotalPages int   `json:"total_pages"`
}

func NewPaginatedResult[T any](items []T, total int64, params PaginationParams) PaginatedResult[T] {
	totalPages := int(math.Ceil(float64(total) / float64(params.Limit)))
	if totalPages < 1 {
		totalPages = 1
	}
	return PaginatedResult[T]{
		Items:      items,
		Total:      total,
		Page:       params.Page,
		TotalPages: totalPages,
	}
}

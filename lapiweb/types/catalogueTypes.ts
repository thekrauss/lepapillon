export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  position: number;
  is_active: boolean;
}

export interface ProductResponse {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  image_url: string;
  stock: number;
  is_active: boolean;
  is_featured: boolean;
  is_kit: boolean;
  prep_time_minutes?: number;
  category?: CategoryResponse;
}

export interface ProductListQuery {
  category?: string;
  featured?: boolean;
  kit?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateProductRequest {
  name: string;
  slug: string;
  description?: string;
  price: number;
  category_id: string;
  image_url?: string;
  stock?: number;
  is_kit?: boolean;
  prep_time_minutes?: number;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  stock?: number;
  is_active?: boolean;
  is_featured?: boolean;
  is_kit?: boolean;
  prep_time_minutes?: number;
}

export interface CreateCategoryRequest {
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  position?: number;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  image_url?: string;
  position?: number;
  is_active?: boolean;
}

import { authClient } from "@/lib/axios-instance";
import type {
  CategoryResponse, ProductResponse, ProductListQuery,
} from "@/types/catalogueTypes";

export const listCategories = () =>
  authClient.get<CategoryResponse[]>("/catalogue/categories");

export const getCategoryBySlug = (slug: string) =>
  authClient.get<CategoryResponse>(`/catalogue/categories/${slug}`);

export const listProducts = (params?: ProductListQuery) =>
  authClient.get<ProductResponse[]>("/catalogue/products", { params });

export const getProductBySlug = (slug: string) =>
  authClient.get<ProductResponse>(`/catalogue/products/${slug}`);

export const listFeaturedProducts = () =>
  authClient.get<ProductResponse[]>("/catalogue/products", {
    params: { featured: true, limit: 8 },
  });

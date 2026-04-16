import { useQuery } from "@tanstack/react-query";
import * as catalogueDAL from "@/DAL/catalogue";
import type { ProductListQuery } from "@/types/catalogueTypes";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => catalogueDAL.listCategories().then((r) => r.data),
  });
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: ["category", slug],
    queryFn: () => catalogueDAL.getCategoryBySlug(slug).then((r) => r.data),
    enabled: !!slug,
  });
}

export function useProducts(params?: ProductListQuery) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => catalogueDAL.listProducts(params).then((r) => r.data),
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => catalogueDAL.getProductBySlug(slug).then((r) => r.data),
    enabled: !!slug,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: () => catalogueDAL.listFeaturedProducts().then((r) => r.data),
  });
}

"use client";

import Link from "next/link";
import { ShoppingBag, UtensilsCrossed, Flame, Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/useCatalogue";
import { useAddItem } from "@/hooks/usePanier";
import { useCartStore } from "@/store/useCartStore";
import type { ProductResponse, ProductListQuery } from "@/types/catalogueTypes";

interface Props {
  products?: ProductResponse[];
  filters?: ProductListQuery;
  categorySlug?: string;
}

export default function ProductGrid({ products: propProducts, filters, categorySlug }: Props) {
  const params = { ...filters };
  if (categorySlug) params.category = categorySlug;

  const { data: fetchedProducts, isLoading, error } = useProducts(propProducts ? undefined : params);
  const addItem = useAddItem();
  const openDrawer = useCartStore((s) => s.openDrawer);

  const products = propProducts ?? fetchedProducts;

  if (!propProducts && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
      </div>
    );
  }

  if (!propProducts && (error || !products)) {
    return (
      <div className="py-20 text-center text-black">
        Impossible de charger les produits.
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="py-20 text-center">
        <UtensilsCrossed className="mx-auto h-12 w-12 text-black/20" />
        <p className="mt-4 text-black">Aucun produit trouve.</p>
      </div>
    );
  }

  const handleAdd = (productId: string) => {
    addItem.mutate({ product_id: productId, quantity: 1 }, {
      onSuccess: () => openDrawer(),
    });
  };

  const fmt = (c: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(c / 100);

  return (
    <div className="grid gap-4 grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const catSlug = product.category?.slug ?? "produit";

        return (
          <div
            key={product.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-card transition-all duration-300 hover:-translate-y-1 hover:border-st-gold/20 hover:shadow-xl hover:shadow-st-gold/[0.06]"
          >
            {/* Image */}
            <Link href={`/boutique/${catSlug}/${product.slug}`} className="block">
              <div className="relative flex aspect-square items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 sm:aspect-[4/3]">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <UtensilsCrossed className="h-8 w-8 text-[var(--foreground)]/[0.06] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12 sm:h-10 sm:w-10" />
                )}

                {/* Badges */}
                <div className="absolute left-2 top-2 flex flex-col gap-1 sm:left-3 sm:top-3 sm:gap-1.5">
                  {product.is_featured && (
                    <span className="rounded-full bg-st-gold/10 px-2 py-0.5 text-[10px] font-bold text-st-gold-hover sm:text-[11px]">
                      Populaire
                    </span>
                  )}
                  {product.is_kit && (
                    <span className="rounded-full bg-st-navy/10 px-2 py-0.5 text-[10px] font-bold text-st-navy sm:text-[11px]">
                      Kit
                    </span>
                  )}
                </div>

                {product.stock <= 3 && product.stock > 0 && (
                  <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 sm:right-3 sm:top-3 sm:gap-1 sm:px-2 sm:text-[11px]">
                    <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span className="hidden sm:inline">Plus que</span> {product.stock}
                  </span>
                )}
              </div>
            </Link>

            {/* Content */}
            <div className="flex flex-1 flex-col p-3 sm:p-5">
              {product.category && (
                <span className="text-[10px] font-semibold uppercase tracking-wider text-st-gold sm:text-[11px]">
                  {product.category.name}
                </span>
              )}
              <Link href={`/boutique/${catSlug}/${product.slug}`}>
                <h3 className="mt-0.5 font-sans text-[13px] font-bold tracking-tight text-[var(--foreground)] transition-colors group-hover:text-st-gold sm:mt-1 sm:text-[15px]">
                  {product.name}
                </h3>
              </Link>
              <p className="mt-1 flex-1 text-[11px] leading-relaxed text-[var(--st-warm-gray)] line-clamp-2 sm:mt-1.5 sm:text-[12px]">
                {product.description}
              </p>

              <div className="mt-3 flex items-center justify-between sm:mt-4">
                <p className="text-[16px] font-bold text-[var(--foreground)] sm:text-xl">
                  {fmt(product.price)}
                </p>
                <button
                  onClick={() => handleAdd(product.id)}
                  disabled={product.stock === 0 || addItem.isPending}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-st-gold text-white transition-all hover:bg-st-gold-hover hover:shadow-md hover:shadow-st-gold/25 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed sm:h-10 sm:w-10"
                >
                  {addItem.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4" />
                  ) : (
                    <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { ShoppingBag, UtensilsCrossed, Flame, Loader2, Plus } from "lucide-react";
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
      <div className="grid gap-4 grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-card">
            <div className="aspect-square animate-pulse bg-gradient-to-br from-[var(--muted)] to-[var(--border)] sm:aspect-[4/3]" />
            <div className="p-4 space-y-2">
              <div className="h-3 w-16 animate-pulse rounded-full bg-[var(--muted)]" />
              <div className="h-4 w-3/4 animate-pulse rounded-full bg-[var(--muted)]" />
              <div className="h-3 w-full animate-pulse rounded-full bg-[var(--muted)]" />
              <div className="flex items-center justify-between pt-1">
                <div className="h-5 w-12 animate-pulse rounded-full bg-[var(--muted)]" />
                <div className="h-9 w-9 animate-pulse rounded-full bg-[var(--muted)]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!propProducts && (error || !products)) {
    return (
      <div className="py-20 text-center text-[var(--st-warm-gray)]">
        Impossible de charger les produits.
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--muted)]">
          <UtensilsCrossed className="h-9 w-9 text-[var(--foreground)]/20" />
        </div>
        <p className="mt-5 text-base font-semibold text-[var(--foreground)]/60">Aucun produit trouvé</p>
        <p className="mt-1 text-[13px] text-[var(--st-warm-gray)]">Essayez une autre catégorie ou recherche.</p>
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
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-st-gold/25 hover:shadow-2xl hover:shadow-st-gold/[0.08]"
          >
            {/* Image */}
            <Link href={`/boutique/${catSlug}/${product.slug}`} className="block">
              <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 sm:aspect-[4/3]">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-108"
                    loading="lazy"
                  />
                ) : (
                  <UtensilsCrossed className="h-8 w-8 text-[var(--foreground)]/[0.06] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12 sm:h-10 sm:w-10" />
                )}

                {/* Hover overlay — slide up */}
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <div className="w-full translate-y-2 p-3 transition-transform duration-300 group-hover:translate-y-0">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleAdd(product.id);
                      }}
                      disabled={product.stock === 0 || addItem.isPending}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/95 py-2.5 text-[12px] font-bold text-st-charcoal transition-all hover:bg-white disabled:opacity-50 sm:text-[13px]"
                    >
                      {addItem.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Ajouter au panier
                    </button>
                  </div>
                </div>

                {/* Badges */}
                <div className="absolute left-2 top-2 flex flex-col gap-1 sm:left-3 sm:top-3">
                  {product.is_featured && (
                    <span className="rounded-full bg-st-gold/12 px-2 py-0.5 text-[10px] font-bold text-st-gold-hover backdrop-blur-sm sm:text-[11px]">
                      Populaire
                    </span>
                  )}
                  {product.is_kit && (
                    <span className="rounded-full bg-st-navy/12 px-2 py-0.5 text-[10px] font-bold text-st-navy backdrop-blur-sm sm:text-[11px]">
                      Kit
                    </span>
                  )}
                </div>

                {product.stock <= 3 && product.stock > 0 && (
                  <span className="absolute right-2 top-2 flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 backdrop-blur-sm sm:right-3 sm:top-3 sm:gap-1 sm:px-2 sm:text-[11px]">
                    <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    <span className="hidden sm:inline">Plus que</span> {product.stock}
                  </span>
                )}
              </div>
            </Link>

            {/* Content */}
            <div className="flex flex-1 flex-col p-3 sm:p-5">
              {product.category && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-st-gold sm:text-[11px]">
                  {product.category.name}
                </span>
              )}
              <Link href={`/boutique/${catSlug}/${product.slug}`}>
                <h3 className="mt-0.5 font-sans text-[13px] font-bold tracking-tight text-[var(--foreground)] transition-colors group-hover:text-st-gold sm:mt-1 sm:text-[15px]">
                  {product.name}
                </h3>
              </Link>
              <p className="mt-1 line-clamp-2 flex-1 text-[11px] leading-relaxed text-[var(--st-warm-gray)] sm:mt-1.5 sm:text-[12px]">
                {product.description}
              </p>

              <div className="mt-3 flex items-center justify-between sm:mt-4">
                <p className="font-serif text-[17px] font-bold text-[var(--foreground)] sm:text-xl">
                  {fmt(product.price)}
                </p>
                {/* Mobile-only add button (overlay handles desktop) */}
                <button
                  onClick={() => handleAdd(product.id)}
                  disabled={product.stock === 0 || addItem.isPending}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-st-gold text-white transition-all hover:bg-st-gold-hover hover:shadow-md hover:shadow-st-gold/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 sm:h-10 sm:w-10"
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

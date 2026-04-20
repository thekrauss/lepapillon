"use client";

import { useState, useMemo } from "react";
import { Search, X, ArrowUpDown, LayoutGrid, Rows3 } from "lucide-react";
import Link from "next/link";
import CategoryTabs from "./CategoryTabs";
import ProductGrid from "./ProductGrid";
import { useProducts, useCategories } from "@/hooks/useCatalogue";
import type { ProductResponse } from "@/types/catalogueTypes";

const ITEMS_PER_PAGE = 12;

type SortKey = "default" | "price_asc" | "price_desc" | "name_asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default",    label: "Par défaut" },
  { value: "price_asc",  label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
  { value: "name_asc",   label: "Nom A → Z" },
];

function sortProducts(products: ProductResponse[], key: SortKey): ProductResponse[] {
  switch (key) {
    case "price_asc":  return [...products].sort((a, b) => a.price - b.price);
    case "price_desc": return [...products].sort((a, b) => b.price - a.price);
    case "name_asc":   return [...products].sort((a, b) => a.name.localeCompare(b.name, "fr"));
    default:           return products;
  }
}

// ── Vue groupée par catégorie ────────────────────────────────────

function CategorySection({
  categoryName,
  categorySlug,
  products,
}: {
  categoryName: string;
  categorySlug: string;
  products: ProductResponse[];
}) {
  const fmt = (c: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(c / 100);

  return (
    <div className="space-y-5">
      {/* section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-st-gold" />
          <h2 className="font-serif text-xl font-bold text-[var(--foreground)]">{categoryName}</h2>
          <span className="rounded-full bg-st-gold/10 px-2.5 py-0.5 text-[11px] font-bold text-st-gold">
            {products.length} produit{products.length > 1 ? "s" : ""}
          </span>
        </div>
        <Link
          href={`/boutique/${categorySlug}`}
          className="text-[13px] font-medium text-st-gold hover:text-st-gold-hover"
        >
          Voir tout →
        </Link>
      </div>

      {/* product row — horizontal scroll on mobile */}
      <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((product) => {
          const catSlug = product.category?.slug ?? categorySlug;
          return (
            <Link
              key={product.id}
              href={`/boutique/${catSlug}/${product.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-card transition-all duration-300 hover:-translate-y-1 hover:border-st-gold/25 hover:shadow-xl hover:shadow-st-gold/[0.07]"
            >
              {/* image */}
              <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--foreground)]/10 text-4xl">
                    🍜
                  </div>
                )}
                {/* badges */}
                <div className="absolute left-2 top-2 flex flex-col gap-1">
                  {product.is_featured && (
                    <span className="rounded-full bg-st-gold/90 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                      Populaire
                    </span>
                  )}
                  {product.is_kit && (
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-st-charcoal backdrop-blur-sm">
                      Kit
                    </span>
                  )}
                </div>
              </div>

              {/* content */}
              <div className="flex flex-1 flex-col p-3">
                <h3 className="text-[13px] font-bold leading-tight text-[var(--foreground)] transition-colors group-hover:text-st-gold sm:text-[14px]">
                  {product.name}
                </h3>
                <p className="mt-1 line-clamp-2 flex-1 text-[11px] leading-relaxed text-[var(--st-warm-gray)]">
                  {product.description}
                </p>
                <p className="mt-2.5 font-serif text-[16px] font-bold text-[var(--foreground)]">
                  {fmt(product.price)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────

export default function BoutiqueContent() {
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const { data: allProducts } = useProducts();
  const { data: categories } = useCategories();

  const filtered = useMemo(() => {
    if (!allProducts) return [];
    let results = allProducts;
    if (categorySlug) {
      results = results.filter((p) => p.category?.slug === categorySlug);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q)
      );
    }
    return sortProducts(results, sort);
  }, [allProducts, categorySlug, search, sort]);

  // Grouper par catégorie quand pas de filtre ni recherche
  const groupedByCategory = useMemo(() => {
    if (categorySlug || search.trim() || !categories || !allProducts) return null;
    return categories
      .filter((cat) => cat.is_active)
      .map((cat) => ({
        ...cat,
        products: sortProducts(
          allProducts.filter((p) => p.category?.slug === cat.slug),
          sort
        ),
      }))
      .filter((g) => g.products.length > 0);
  }, [categorySlug, search, categories, allProducts, sort]);

  const handleCategoryChange = (slug: string | null) => {
    setCategorySlug(slug);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  const visibleProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const totalCount = allProducts?.length ?? 0;
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Trier";

  const isGroupedView = !!groupedByCategory && !categorySlug && !search.trim();

  return (
    <>
      {/* ── Filters bar ──────────────────────────────────── */}
      <div className="sticky top-16 lg:top-[72px] z-30 -mx-5 px-5 py-3.5 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10 backdrop-blur-xl bg-[var(--background)]/90 border-b border-[var(--border)]/60">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CategoryTabs activeSlug={categorySlug} onSelect={handleCategoryChange} />

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Rechercher..."
                className="st-input w-full py-2.5 pl-9 pr-8 text-[13px] sm:w-48"
              />
              {search && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--st-warm-gray)] hover:text-[var(--foreground)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-card px-3.5 py-2.5 text-[13px] font-medium text-[var(--foreground)] transition-all hover:border-st-gold/30"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-st-warm-gray" />
                <span className="hidden sm:inline">{currentSortLabel}</span>
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-1.5 w-48 overflow-hidden rounded-xl border border-[var(--border)] bg-card shadow-lg">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setSort(opt.value); setSortOpen(false); }}
                        className={`flex w-full items-center gap-2 px-4 py-2.5 text-[13px] transition-colors hover:bg-st-gold/8 ${
                          sort === opt.value ? "font-semibold text-st-gold" : "text-[var(--foreground)]/80"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* count */}
        <p className="mt-2 text-[12px] text-[var(--st-warm-gray)]">
          {isGroupedView
            ? `${totalCount} produit${totalCount > 1 ? "s" : ""} — ${categories?.length ?? 0} catégories`
            : filtered.length === totalCount
              ? `${totalCount} produit${totalCount > 1 ? "s" : ""}`
              : `${filtered.length} résultat${filtered.length > 1 ? "s" : ""} sur ${totalCount}`}
          {search && (
            <> pour <span className="font-medium text-[var(--foreground)]">&ldquo;{search}&rdquo;</span></>
          )}
        </p>
      </div>

      {/* ── Vue groupée par catégorie ─────────────────────── */}
      {isGroupedView ? (
        <div className="mt-10 space-y-14">
          {groupedByCategory!.map((group) => (
            <CategorySection
              key={group.id}
              categoryName={group.name}
              categorySlug={group.slug}
              products={group.products}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-8">
            <ProductGrid products={visibleProducts} />
          </div>
          {hasMore && (
            <div className="mt-10 text-center">
              <button
                onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
                className="st-btn-secondary gap-2 px-8 py-3 text-[13px]"
              >
                Voir plus ({filtered.length - visibleCount} restants)
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

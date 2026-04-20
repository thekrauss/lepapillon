// "use client";

// import { useState, useMemo } from "react";
// import { Search, SlidersHorizontal, X } from "lucide-react";
// import CategoryTabs from "./CategoryTabs";
// import ProductGrid from "./ProductGrid";
// import { useProducts } from "@/hooks/useCatalogue";

// const ITEMS_PER_PAGE = 12;

// export default function BoutiqueContent() {
//   const [categorySlug, setCategorySlug] = useState<string | null>(null);
//   const [search, setSearch] = useState("");
//   const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

//   const { data: allProducts } = useProducts();

//   // Filter products client-side for search
//   const filtered = useMemo(() => {
//     if (!allProducts) return [];
//     let results = allProducts;
//     if (categorySlug) {
//       results = results.filter((p) => p.category?.slug === categorySlug);
//     }
//     if (search.trim()) {
//       const q = search.toLowerCase();
//       results = results.filter(
//         (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.category?.name.toLowerCase().includes(q)
//       );
//     }
//     return results;
//   }, [allProducts, categorySlug, search]);

//   // Reset visible count when filters change
//   const handleCategoryChange = (slug: string | null) => {
//     setCategorySlug(slug);
//     setVisibleCount(ITEMS_PER_PAGE);
//   };

//   const handleSearchChange = (val: string) => {
//     setSearch(val);
//     setVisibleCount(ITEMS_PER_PAGE);
//   };

//   const visibleProducts = filtered.slice(0, visibleCount);
//   const hasMore = visibleCount < filtered.length;
//   const totalCount = allProducts?.length ?? 0;

//   return (
//     <>
//       {/* Filters bar */}
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//         <CategoryTabs activeSlug={categorySlug} onSelect={handleCategoryChange} />
//         <div className="relative w-full max-w-xs">
//           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
//           <input
//             type="text"
//             value={search}
//             onChange={(e) => handleSearchChange(e.target.value)}
//             placeholder="Rechercher un produit..."
//             className="st-input w-full pl-10 pr-8 text-[13px]"
//           />
//           {search && (
//             <button onClick={() => handleSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--st-warm-gray)] hover:text-[var(--foreground)]">
//               <X className="h-3.5 w-3.5" />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Results count */}
//       <p className="mt-4 text-[12px] text-[var(--st-warm-gray)]">
//         {filtered.length === totalCount
//           ? `${totalCount} produits`
//           : `${filtered.length} produit${filtered.length > 1 ? "s" : ""} sur ${totalCount}`
//         }
//         {search && <> pour &quot;{search}&quot;</>}
//       </p>

//       {/* Product grid (pass pre-filtered products) */}
//       <div className="mt-6">
//         <ProductGrid products={visibleProducts} />
//       </div>

//       {/* Load more */}
//       {hasMore && (
//         <div className="mt-8 text-center">
//           <button
//             onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
//             className="st-btn-secondary gap-2 px-8 py-3 text-[13px]"
//           >
//             Voir plus de produits ({filtered.length - visibleCount} restants)
//           </button>
//         </div>
//       )}
//     </>
//   );
// }


"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import CategoryTabs from "./CategoryTabs";
import ProductGrid from "./ProductGrid";
import { useProducts } from "@/hooks/useCatalogue";
import ImageParallax from "@/components/ImageParallax"; // 1. On importe le Parallax

const ITEMS_PER_PAGE = 12;

export default function BoutiqueContent() {
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const { data: allProducts } = useProducts();

  const filtered = useMemo(() => {
    if (!allProducts) return [];
    let results = allProducts;
    if (categorySlug) {
      results = results.filter((p) => p.category?.slug === categorySlug);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.category?.name.toLowerCase().includes(q)
      );
    }
    return results;
  }, [allProducts, categorySlug, search]);

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

  return (
    // 2. On remplace le fragment <> par une section relative
    <section className="relative min-h-screen py-12 lg:py-24 overflow-hidden">
      
      {/* ── BACKGROUND AVEC EFFET PARALLAX ──────────────── */}
      <div className="absolute inset-0 z-0">
        <ImageParallax 
          src="/images/boutique.jpg" // Choisis une belle image d'épicerie ou d'ingrédients
          alt="Boutique Saveurs Thaï"
          className="absolute inset-0 h-full w-full"
        />
        {/* Overlay : On le met un peu plus opaque (60%) pour que les produits restent très lisibles */}
        <div className="absolute inset-0 bg-st-cream/20 backdrop-blur-[20px]" />
      </div>

      {/* ── CONTENU DE LA BOUTIQUE ──────────────────────── */}
      <div className="st-section relative z-10">
        
        {/* ── BARRE DE FILTRES AVEC EFFET GLASSMORPHISM ── */}
        <div className="mb-10 rounded-2xl bg-white/50 p-6 backdrop-blur-md border border-white/40 shadow-lg">
          
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <CategoryTabs activeSlug={categorySlug} onSelect={handleCategoryChange} />
            
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Rechercher un produit..."
                className="st-input w-full bg-white/60 backdrop-blur-sm pl-10 pr-8 text-[13px] focus:bg-white transition-all duration-300"
              />
              {search && (
                <button onClick={() => handleSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--st-warm-gray)] hover:text-[var(--foreground)]">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <p className="mt-5 border-t border-white/40 pt-4 text-[12px] font-medium text-[var(--st-charcoal)]">
            {filtered.length === totalCount
              ? `${totalCount} produits`
              : `${filtered.length} produit${filtered.length > 1 ? "s" : ""} sur ${totalCount}`
            }
            {search && <> pour &quot;<span className="font-bold">{search}</span>&quot;</>}
          </p>
        </div>

        {/* ── GRILLE DE PRODUITS ────────────────────────── */}
        <div>
          <ProductGrid products={visibleProducts} />
        </div>

        {/* ── BOUTON VOIR PLUS ──────────────────────────── */}
        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setVisibleCount((c) => c + ITEMS_PER_PAGE)}
              className="st-btn-secondary bg-white/60 backdrop-blur-md border border-white/40 shadow-sm gap-2 px-8 py-3 text-[13px] hover:bg-white"
            >
              Voir plus de produits ({filtered.length - visibleCount} restants)
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
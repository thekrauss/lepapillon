"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Star, ChefHat, Minus, Plus, ArrowLeft, Loader2, Clock } from "lucide-react";
import { useProduct } from "@/hooks/useCatalogue";
import { useAddItem } from "@/hooks/usePanier";
import { useCartStore } from "@/store/useCartStore";

interface Props {
  categorySlug: string;
  productSlug: string;
}

export default function ProductDetail({ categorySlug, productSlug }: Props) {
  const { data: product, isLoading } = useProduct(productSlug);
  const addItem = useAddItem();
  const openDrawer = useCartStore((s) => s.openDrawer);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-32 text-center">
        <p className="text-lg font-semibold">Produit introuvable</p>
        <Link href="/boutique" className="mt-4 inline-flex items-center gap-1 text-st-gold">
          <ArrowLeft className="h-4 w-4" /> Retour boutique
        </Link>
      </div>
    );
  }

  const priceEuros = (product.price / 100).toFixed(2);
  const totalEuros = ((product.price * quantity) / 100).toFixed(2);

  const handleAdd = () => {
    addItem.mutate({ product_id: product.id, quantity }, {
      onSuccess: () => {
        openDrawer();
        setQuantity(1);
      },
    });
  };

  return (
    <section className="py-10">
      <div className="st-section">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-[13px] text-[var(--st-warm-gray)]">
          <Link href="/boutique" className="transition-colors hover:text-st-gold">Boutique</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link href={`/boutique/${categorySlug}`} className="capitalize transition-colors hover:text-st-gold">
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-[var(--foreground)]">{product.name}</span>
        </nav>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Image */}
          <div>
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[#FFF7ED] to-[#F5F0EB]">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <ShoppingBag className="h-16 w-16 text-[var(--foreground)]/[0.06]" />
              )}
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap gap-2">
              {product.is_featured && <span className="st-badge">Populaire</span>}
              {product.is_kit && <span className="rounded-full bg-st-navy/10 px-2.5 py-0.5 text-[11px] font-bold text-st-navy">Kit complet</span>}
              {product.stock <= 3 && product.stock > 0 && (
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600">
                  Plus que {product.stock} !
                </span>
              )}
            </div>

            <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight">{product.name}</h1>

            {product.category && (
              <p className="mt-1 text-[13px] text-st-gold font-semibold uppercase tracking-wider">
                {product.category.name}
              </p>
            )}

            <div className="mt-3 flex items-center gap-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < 4 ? "fill-st-gold text-st-gold" : "text-[var(--border)]"}`} />
                ))}
              </div>
              <span className="text-[13px] text-[var(--st-warm-gray)]">(12 avis)</span>
            </div>

            <p className="mt-6 text-3xl font-bold">
              {priceEuros} <span className="text-lg font-normal text-[var(--st-warm-gray)]">&euro;</span>
            </p>

            <p className="mt-4 text-[15px] leading-relaxed text-[var(--st-warm-gray)]">
              {product.description}
            </p>

            {product.prep_time_minutes && (
              <div className="mt-4 flex items-center gap-2 text-[13px] text-[var(--st-warm-gray)]">
                <Clock className="h-4 w-4 text-st-gold" />
                Preparation : {product.prep_time_minutes} min
              </div>
            )}

            {/* Quantity */}
            <div className="mt-6">
              <p className="text-sm font-semibold">Quantite</p>
              <div className="mt-2 inline-flex items-center gap-3 rounded-full border border-[var(--border)] px-1 py-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--muted)]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--muted)]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {quantity > 1 && (
                <p className="mt-1 text-[13px] text-[var(--st-warm-gray)]">
                  Total : {totalEuros} &euro;
                </p>
              )}
            </div>

            <button
              onClick={handleAdd}
              disabled={product.stock === 0 || addItem.isPending}
              className="st-btn-primary mt-8 w-full gap-2 py-4 text-[15px] sm:w-auto sm:px-10 disabled:opacity-40"
            >
              {addItem.isPending ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Ajout...</>
              ) : product.stock === 0 ? (
                "Rupture de stock"
              ) : (
                <><ShoppingBag className="h-5 w-5" /> Ajouter au panier</>
              )}
            </button>

            {/* Upsell prestation */}
            {product.is_kit && (
              <div className="mt-8 rounded-2xl border border-st-gold/15 bg-[var(--st-gold-wash)] p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-st-gold/10">
                    <ChefHat className="h-5 w-5 text-st-gold" />
                  </div>
                  <div>
                    <p className="text-[13px] font-bold">Ajoutez la prestation cheffe !</p>
                    <p className="mt-1 text-[12px] text-[var(--st-warm-gray)]">
                      Faites preparer ce kit par notre cheffe a votre domicile.
                    </p>
                    <Link href="/prestation-chef" className="mt-2 inline-flex text-[12px] font-semibold text-st-gold transition-colors hover:text-st-gold-hover">
                      En savoir plus &rarr;
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

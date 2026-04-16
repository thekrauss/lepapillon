"use client";

import Link from "next/link";
import { ShoppingBag, Trash2, Minus, Plus, ChefHat, ArrowRight, Loader2 } from "lucide-react";
import { useCart, useUpdateItem, useRemoveItem, useClearCart } from "@/hooks/usePanier";

const fmt = (c: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(c / 100);

export default function CartPage() {
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateItem();
  const removeItem = useRemoveItem();
  const clearCart = useClearCart();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <ShoppingBag className="h-16 w-16 text-[var(--foreground)]/[0.06]" />
        <h2 className="mt-6 font-serif text-2xl font-bold">Votre panier est vide</h2>
        <p className="mt-2 text-[var(--st-warm-gray)]">Decouvrez nos kits et ajoutez des produits.</p>
        <Link href="/boutique" className="st-btn-primary mt-8 gap-2">
          <ShoppingBag className="h-4 w-4" /> Voir la boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      {/* Items */}
      <div className="space-y-4 lg:col-span-2">
        {cart.items.map((item) => (
          <div key={item.product_id} className="st-card p-4 sm:p-5">
            <div className="flex gap-3 sm:gap-4">
              {/* Image */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FFF7ED] to-[#F5F0EB] sm:h-20 sm:w-20">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.product_name} className="h-full w-full rounded-xl object-cover" />
                ) : (
                  <ShoppingBag className="h-5 w-5 text-[var(--foreground)]/[0.08] sm:h-6 sm:w-6" />
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-sans text-[14px] font-bold sm:text-[15px]">{item.product_name}</p>
                    <p className="mt-0.5 text-[12px] text-[var(--st-warm-gray)] sm:text-[13px]">{fmt(item.price)} / unite</p>
                  </div>
                  {/* Remove — visible on all sizes */}
                  <button
                    onClick={() => removeItem.mutate(item.product_id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--st-warm-gray)] transition hover:bg-red-50 hover:text-red-500 sm:h-8 sm:w-8"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Quantity + subtotal */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => item.quantity <= 1
                        ? removeItem.mutate(item.product_id)
                        : updateItem.mutate({ product_id: item.product_id, quantity: item.quantity - 1 })}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] transition hover:bg-[var(--muted)]"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-[14px] font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateItem.mutate({ product_id: item.product_id, quantity: item.quantity + 1 })}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] transition hover:bg-[var(--muted)]"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[15px] font-bold">{fmt(item.subtotal)}</p>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Prestation upsell */}
        {!cart.prestation && (
          <Link href="/panier/prestation" className="block rounded-2xl border border-st-gold/15 bg-[var(--st-gold-wash)] p-4 transition-colors hover:border-st-gold/30 sm:p-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-st-gold/10 sm:h-12 sm:w-12">
                <ChefHat className="h-5 w-5 text-st-gold sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1">
                <p className="font-sans text-[14px] font-bold sm:text-[15px]">Ajouter une prestation cheffe</p>
                <p className="mt-1 text-[12px] text-[var(--st-warm-gray)] sm:text-[13px]">
                  Faites cuisiner vos produits a domicile par notre cheffe thailandaise.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-st-gold">
                  Choisir une date <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        )}

        {cart.prestation && (
          <div className="rounded-2xl border border-st-gold/15 bg-[var(--st-gold-wash)] p-4 sm:p-6">
            <div className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-st-gold" />
              <p className="font-sans text-[14px] font-bold sm:text-[15px]">Prestation cheffe incluse</p>
            </div>
            <p className="mt-2 text-[12px] text-[var(--st-warm-gray)] sm:text-[13px]">
              {new Date(cart.prestation.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              {" "}&mdash; {cart.prestation.time_slot} &mdash; {cart.prestation.guest_count} convives
            </p>
            <p className="mt-1 text-[12px] text-[var(--st-warm-gray)] sm:text-[13px]">
              {cart.prestation.street}, {cart.prestation.postal_code} {cart.prestation.city}
            </p>
            <p className="mt-2 text-[16px] font-bold text-st-gold sm:text-lg">{fmt(cart.prestation.price)}</p>
          </div>
        )}

        <button
          onClick={() => clearCart.mutate()}
          disabled={clearCart.isPending}
          className="text-[13px] font-medium text-[var(--st-warm-gray)] transition hover:text-red-500"
        >
          Vider le panier
        </button>
      </div>

      {/* Summary */}
      <div>
        <div className="st-card sticky top-24">
          <h2 className="font-sans text-lg font-bold">Recapitulatif</h2>
          <div className="mt-5 space-y-3 text-[14px]">
            <div className="flex justify-between">
              <span className="text-[var(--st-warm-gray)]">Produits ({cart.item_count})</span>
              <span className="font-semibold">{fmt(cart.items_total)}</span>
            </div>
            {cart.prestation_total > 0 && (
              <div className="flex justify-between">
                <span className="text-[var(--st-warm-gray)]">Prestation cheffe</span>
                <span className="font-semibold">{fmt(cart.prestation_total)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--st-warm-gray)]">Livraison</span>
              <span className="font-semibold text-st-forest">Gratuite</span>
            </div>
            <div className="border-t border-[var(--border)] pt-3">
              <div className="flex justify-between text-lg">
                <span className="font-bold">Total</span>
                <span className="font-bold text-st-gold">{fmt(cart.total)}</span>
              </div>
            </div>
          </div>
          <Link href="/checkout" className="st-btn-primary mt-6 w-full gap-2 py-3.5">
            Passer commande <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag, ChefHat, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, useUpdateItem, useRemoveItem } from "@/hooks/usePanier";
import { useCartStore } from "@/store/useCartStore";

export default function CartDrawer() {
  const { isOpen, closeDrawer, setCart } = useCartStore();
  const { data: cart, isLoading } = useCart();
  const updateItem = useUpdateItem();
  const removeItem = useRemoveItem();

  useEffect(() => {
    if (cart) setCart(cart);
  }, [cart, setCart]);

  const formatPrice = (centimes: number) => (centimes / 100).toFixed(2);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--background)] shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <h2 className="flex items-center gap-2 font-sans text-lg font-bold">
                <ShoppingBag className="h-5 w-5 text-st-gold" />
                Mon panier
                {cart && cart.item_count > 0 && (
                  <span className="rounded-full bg-st-gold px-2 py-0.5 text-xs font-bold text-white">
                    {cart.item_count}
                  </span>
                )}
              </h2>
              <button onClick={closeDrawer} className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--muted)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-st-gold" />
                </div>
              ) : !cart || cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <ShoppingBag className="h-12 w-12 text-[var(--foreground)]/[0.06]" />
                  <p className="mt-4 font-semibold">Votre panier est vide</p>
                  <p className="mt-1 text-[13px] text-[var(--st-warm-gray)]">
                    Explorez notre catalogue et ajoutez des produits.
                  </p>
                  <Link href="/boutique" onClick={closeDrawer} className="st-btn-primary mt-6 gap-2 text-[13px]">
                    Voir la boutique
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <div key={item.product_id} className="flex items-center gap-4 rounded-xl border border-[var(--border)] p-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#FFF7ED] to-[#F5F0EB]">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.product_name} className="h-full w-full rounded-lg object-cover" />
                        ) : (
                          <ShoppingBag className="h-5 w-5 text-[var(--foreground)]/[0.08]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[13px] font-bold">{item.product_name}</p>
                        <p className="text-[12px] text-[var(--st-warm-gray)]">{formatPrice(item.price)} &euro;/u</p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeItem.mutate(item.product_id);
                              } else {
                                updateItem.mutate({ product_id: item.product_id, quantity: item.quantity - 1 });
                              }
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] transition hover:bg-[var(--muted)]"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateItem.mutate({ product_id: item.product_id, quantity: item.quantity + 1 })}
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border)] transition hover:bg-[var(--muted)]"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <p className="text-sm font-bold">{formatPrice(item.subtotal)} &euro;</p>
                        <button
                          onClick={() => removeItem.mutate(item.product_id)}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--st-warm-gray)] transition hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Prestation upsell */}
                  {!cart.prestation && (
                    <Link
                      href="/panier/prestation"
                      onClick={closeDrawer}
                      className="flex items-start gap-3 rounded-xl border border-st-gold/15 bg-[var(--st-gold-wash)] p-4 transition-colors hover:border-st-gold/30"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-st-gold/10">
                        <ChefHat className="h-5 w-5 text-st-gold" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold">Ajouter la prestation cheffe</p>
                        <p className="mt-0.5 text-[11px] text-[var(--st-warm-gray)]">
                          Faites cuisiner vos produits chez vous
                        </p>
                      </div>
                    </Link>
                  )}

                  {cart.prestation && (
                    <div className="rounded-xl border border-st-gold/15 bg-[var(--st-gold-wash)] p-4">
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-4 w-4 text-st-gold" />
                        <p className="text-[13px] font-bold">Prestation cheffe</p>
                      </div>
                      <p className="mt-1 text-[12px] text-[var(--st-warm-gray)]">
                        {new Date(cart.prestation.date).toLocaleDateString("fr-FR")} &mdash; {cart.prestation.time_slot} &mdash; {cart.prestation.guest_count} pers.
                      </p>
                      <p className="mt-1 text-[13px] font-bold text-st-gold">{formatPrice(cart.prestation.price)} &euro;</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart && cart.items.length > 0 && (
              <div className="border-t border-[var(--border)] px-6 py-4">
                <div className="space-y-2 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--st-warm-gray)]">Produits</span>
                    <span className="font-semibold">{formatPrice(cart.items_total)} &euro;</span>
                  </div>
                  {cart.prestation_total > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--st-warm-gray)]">Prestation</span>
                      <span className="font-semibold">{formatPrice(cart.prestation_total)} &euro;</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-[var(--border)] pt-2 text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-st-gold">{formatPrice(cart.total)} &euro;</span>
                  </div>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeDrawer}
                  className="st-btn-primary mt-4 w-full gap-2 py-3.5"
                >
                  Commander <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

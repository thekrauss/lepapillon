"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, ChefHat, Users, MapPin, Settings, Loader2, Package, Clock, Mail, ChevronDown, Phone, Euro, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBookingDetails } from "@/hooks/useAdmin";

const statusConfig: Record<string, { text: string; color: string }> = {
  confirmed: { text: "Confirmee", color: "bg-st-forest/10 text-st-forest" },
  completed: { text: "Terminee", color: "bg-gray-100 text-gray-600" },
  cancelled: { text: "Annulee", color: "bg-red-50 text-red-600" },
};

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export default function AdminPrestationsPage() {
  const { data: bookings, isLoading } = useBookingDetails();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold">Prestations</h1>
          <p className="mt-1 text-[14px] text-[var(--st-warm-gray)]">
            {bookings?.length ?? 0} reservation(s)
          </p>
        </div>
        <Link href="/admin/prestations/creneaux" className="st-btn-secondary gap-1.5 text-[13px]">
          <Settings className="h-4 w-4" /> Gerer les creneaux
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
        </div>
      ) : !bookings?.length ? (
        <p className="py-12 text-center text-[14px] text-[var(--st-warm-gray)]">Aucune prestation reservee.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const st = statusConfig[b.status] ?? { text: b.status, color: "bg-gray-100 text-gray-600" };
            const isOpen = expandedId === b.booking_id;
            const itemCount = b.order_items?.length ?? 0;

            return (
              <div key={b.booking_id} className="st-card overflow-hidden p-0">
                {/* ── Compact header (always visible) ────── */}
                <button
                  onClick={() => toggle(b.booking_id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--muted)]/30"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-st-gold/10">
                    <ChefHat className="h-5 w-5 text-st-gold" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[14px] font-bold">{b.user_name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${st.color}`}>{st.text}</span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[12px] text-[var(--st-warm-gray)]">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-st-gold/70" />
                        {fmtDate(b.slot_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-st-gold/70" />
                        {b.time_slot}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-st-gold/70" />
                        {b.guest_count} conv.
                      </span>
                      <span className="flex items-center gap-1">
                        <Package className="h-3 w-3 text-st-gold/70" />
                        {itemCount} produit{itemCount > 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-bold text-st-gold">{fmt(b.order_total)}</p>
                  </div>

                  <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--st-warm-gray)] transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* ── Expanded detail ─────────────────────── */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[var(--border)] px-5 py-5 space-y-5">

                        {/* Client info */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">Client</h4>
                            <div className="space-y-1.5 text-[13px]">
                              <p className="font-semibold">{b.user_name}</p>
                              <p className="flex items-center gap-1.5 text-[var(--st-warm-gray)]">
                                <Mail className="h-3.5 w-3.5" /> {b.user_email}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">Lieu</h4>
                            <div className="space-y-1.5 text-[13px]">
                              <p className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-st-gold/70" />
                                {b.address_street}
                              </p>
                              <p className="pl-5 text-[var(--st-warm-gray)]">{b.address_postal_code} {b.address_city}</p>
                            </div>
                          </div>
                        </div>

                        {/* Notes */}
                        {b.notes && (
                          <div className="flex items-start gap-2 rounded-xl bg-yellow-50 px-4 py-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
                            <div>
                              <p className="text-[11px] font-bold uppercase text-yellow-700">Note importante</p>
                              <p className="mt-0.5 text-[13px] text-yellow-800">{b.notes}</p>
                            </div>
                          </div>
                        )}

                        {/* Products to prepare */}
                        {b.order_items && b.order_items.length > 0 && (
                          <div>
                            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">
                              Produits a preparer ({b.order_items.length})
                            </h4>
                            <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
                              {b.order_items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 px-4 py-3">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--muted)]">
                                    <Package className="h-4 w-4 text-[var(--st-warm-gray)]" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[13px] font-semibold">{item.product_name}</p>
                                    <p className="text-[11px] text-[var(--st-warm-gray)]">{fmt(item.price)} / unite</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-st-gold/10 text-[12px] font-bold text-st-gold">
                                      x{item.quantity}
                                    </span>
                                  </div>
                                  <div className="w-20 text-right shrink-0">
                                    <span className="text-[13px] font-semibold">{fmt(item.price * item.quantity)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Total */}
                            <div className="mt-3 flex items-center justify-end gap-2 text-[14px]">
                              <span className="text-[var(--st-warm-gray)]">Total commande :</span>
                              <span className="font-bold text-st-gold">{fmt(b.order_total)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

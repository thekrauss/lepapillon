"use client";

import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Package, Loader2 } from "lucide-react";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useOrders } from "@/hooks/useCheckout";

const statusConfig: Record<string, { text: string; color: string }> = {
  pending: { text: "En attente", color: "bg-yellow-50 text-yellow-700" },
  paid: { text: "Payee", color: "bg-blue-50 text-blue-600" },
  preparing: { text: "En preparation", color: "bg-st-gold/10 text-st-gold-hover" },
  ready: { text: "Prete", color: "bg-st-forest/10 text-st-forest" },
  picked_up: { text: "Recuperee", color: "bg-gray-100 text-gray-600" },
  cancelled: { text: "Annulee", color: "bg-red-50 text-red-600" },
};

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default function CommandesPage() {
  const { data: orders, isLoading } = useOrders();

  return (
    <AuthGuard>
      <Header />
      <main className="min-h-screen pt-20">
        <section className="py-10">
          <div className="st-section mx-auto max-w-2xl">
            <Link href="/compte" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
              <ArrowLeft className="h-3.5 w-3.5" /> Mon compte
            </Link>
            <h1 className="st-heading">Mes commandes</h1>

            {isLoading ? (
              <div className="mt-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
              </div>
            ) : !orders?.length ? (
              <p className="mt-8 text-center text-[14px] text-[var(--st-warm-gray)]">Aucune commande pour le moment.</p>
            ) : (
              <div className="mt-8 space-y-3">
                {orders.map((o) => {
                  const st = statusConfig[o.status] ?? { text: o.status, color: "bg-gray-100 text-gray-600" };
                  return (
                    <div key={o.id} className="st-card flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--muted)]">
                          <Package className="h-5 w-5 text-[var(--st-warm-gray)]" />
                        </div>
                        <div>
                          <p className="font-sans text-[14px] font-bold">{o.items.map((i) => i.product_name).join(", ")}</p>
                          <p className="text-[12px] text-[var(--st-warm-gray)]">{fmtDate(o.created_at)} — {fmt(o.total)}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.color}`}>
                        {st.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </AuthGuard>
  );
}

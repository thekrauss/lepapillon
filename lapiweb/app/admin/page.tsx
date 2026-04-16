"use client";

import { Package, ShoppingBag, ChefHat, Users, Euro, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useDashboard } from "@/hooks/useAdmin";

const statusLabel: Record<string, { text: string; color: string }> = {
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
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function AdminDashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
      </div>
    );
  }

  const stats = [
    { icon: Euro, label: "Chiffre d'affaires", value: data ? fmt(data.total_revenue) : "0 EUR" },
    { icon: ShoppingBag, label: "Commandes", value: String(data?.order_count ?? 0), badge: data?.pending_orders ? `${data.pending_orders} en attente` : undefined },
    { icon: ChefHat, label: "Prestations", value: String(data?.prestation_count ?? 0) },
    { icon: Users, label: "Clients", value: String(data?.customer_count ?? 0) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-sans text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-[14px] text-[var(--st-warm-gray)]">Vue d&apos;ensemble de votre activite.</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="st-card">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-st-gold/10">
                <s.icon className="h-5 w-5 text-st-gold" />
              </div>
              {s.badge && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-50 px-2 py-0.5 text-[11px] font-bold text-yellow-700">
                  <Clock className="h-3 w-3" />
                  {s.badge}
                </span>
              )}
            </div>
            <p className="mt-4 text-2xl font-bold">{s.value}</p>
            <p className="text-[12px] text-[var(--st-warm-gray)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Commandes recentes */}
      <div className="st-card">
        <div className="flex items-center justify-between">
          <h2 className="font-sans text-lg font-bold">Commandes recentes</h2>
          <Link href="/admin/commandes" className="text-[13px] font-medium text-st-gold hover:text-st-gold-hover">
            Voir tout
          </Link>
        </div>

        {!data?.recent_orders?.length ? (
          <p className="mt-6 text-center text-[14px] text-[var(--st-warm-gray)]">Aucune commande pour le moment.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {data.recent_orders.map((o) => {
              const st = statusLabel[o.status] ?? { text: o.status, color: "bg-gray-100 text-gray-600" };
              return (
                <div key={o.order_id} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-[var(--st-warm-gray)]" />
                    <div>
                      <span className="text-[13px] font-semibold">{o.user_email}</span>
                      <p className="text-[11px] text-[var(--st-warm-gray)]">{fmtDate(o.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] font-semibold">{fmt(o.total)}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.color}`}>
                      {st.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { use } from "react";
import { ArrowLeft, Package, User, MapPin, Loader2, Hash } from "lucide-react";
import { useAdminOrder, useUpdateOrderStatus } from "@/hooks/useAdmin";
import type { UpdateOrderStatusRequest } from "@/types/adminTypes";

const statusConfig: Record<string, { text: string; color: string }> = {
  pending:    { text: "En attente",    color: "bg-yellow-50 text-yellow-700" },
  paid:       { text: "Payée",         color: "bg-blue-50 text-blue-600" },
  preparing:  { text: "En préparation", color: "bg-st-gold/10 text-st-gold-hover" },
  ready:      { text: "Prête",         color: "bg-st-forest/10 text-st-forest" },
  picked_up:  { text: "Récupérée",     color: "bg-gray-100 text-gray-600" },
  cancelled:  { text: "Annulée",       color: "bg-red-50 text-red-600" },
};

const statusFlow: UpdateOrderStatusRequest["status"][] = [
  "pending", "paid", "preparing", "ready", "picked_up",
];

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminCommandeDetailPage({ params }: Props) {
  const { id } = use(params);
  const { data: order, isLoading } = useAdminOrder(id);
  const updateStatus = useUpdateOrderStatus();

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/admin/commandes" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
          <ArrowLeft className="h-3.5 w-3.5" /> Commandes
        </Link>
        <p className="text-[var(--st-warm-gray)]">Commande introuvable.</p>
      </div>
    );
  }

  const st = statusConfig[order.status] ?? { text: order.status, color: "bg-gray-100 text-gray-600" };
  const currentIdx = statusFlow.indexOf(order.status as typeof statusFlow[number]);
  const nextStatus = currentIdx >= 0 && currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/commandes" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--st-warm-gray)] hover:text-st-gold">
        <ArrowLeft className="h-3.5 w-3.5" /> Commandes
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-2xl font-bold">Commande</h1>
            <span className="font-mono text-[13px] text-[var(--st-warm-gray)]">#{order.order_id.slice(0, 8)}</span>
          </div>
          <p className="mt-0.5 text-[13px] text-[var(--st-warm-gray)]">{fmtDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${st.color}`}>{st.text}</span>
          {nextStatus && (
            <button
              onClick={() => updateStatus.mutate({ orderId: order.order_id, data: { status: nextStatus } })}
              disabled={updateStatus.isPending}
              className="st-btn-primary py-2 text-[13px] disabled:opacity-50"
            >
              {updateStatus.isPending ? "..." : `→ ${statusConfig[nextStatus]?.text}`}
            </button>
          )}
          {order.status !== "cancelled" && order.status !== "picked_up" && (
            <button
              onClick={() => {
                if (confirm("Annuler cette commande ?"))
                  updateStatus.mutate({ orderId: order.order_id, data: { status: "cancelled" } });
              }}
              disabled={updateStatus.isPending}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
            >
              Annuler
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* client */}
        <div className="st-card">
          <h2 className="flex items-center gap-2 font-sans text-[14px] font-bold">
            <User className="h-4 w-4 text-st-gold" /> Client
          </h2>
          <div className="mt-3 space-y-1 text-[13px] text-[var(--st-warm-gray)]">
            <p className="font-medium text-[var(--foreground)]">{order.user_name}</p>
            <p>{order.user_email}</p>
            {order.user_phone && <p>{order.user_phone}</p>}
          </div>
        </div>

        {/* livraison */}
        <div className="st-card">
          <h2 className="flex items-center gap-2 font-sans text-[14px] font-bold">
            <MapPin className="h-4 w-4 text-st-gold" /> Adresse de retrait
          </h2>
          <div className="mt-3 space-y-1 text-[13px] text-[var(--st-warm-gray)]">
            <p>{order.delivery_street}</p>
            <p>{order.delivery_postal} {order.delivery_city}</p>
            {order.delivery_phone && <p>{order.delivery_phone}</p>}
          </div>
        </div>
      </div>

      {/* pickup code */}
      {order.pickup_code && (
        <div className="flex items-center gap-3 rounded-xl border border-st-gold/20 bg-st-gold/5 px-5 py-3">
          <Hash className="h-5 w-5 text-st-gold" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-st-gold/70">Code de retrait</p>
            <p className="font-mono text-xl font-bold tracking-widest text-st-gold">{order.pickup_code}</p>
          </div>
        </div>
      )}

      {/* articles */}
      <div className="st-card">
        <h2 className="flex items-center gap-2 font-sans text-[14px] font-bold">
          <Package className="h-4 w-4 text-st-gold" /> Articles ({order.items.length})
        </h2>
        <div className="mt-4 space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between rounded-lg px-1 py-2 text-[13px]">
              <span>
                <span className="font-semibold">{item.product_name}</span>
                <span className="ml-2 text-[var(--st-warm-gray)]">× {item.quantity}</span>
              </span>
              <span className="font-semibold">{fmt(item.price * item.quantity)}</span>
            </div>
          ))}
          {order.prestation_total > 0 && (
            <div className="flex items-center justify-between rounded-lg px-1 py-2 text-[13px]">
              <span className="font-semibold">Prestation cheffe</span>
              <span className="font-semibold">{fmt(order.prestation_total)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-[var(--border)] pt-3 text-[15px] font-bold">
            <span>Total</span>
            <span className="text-st-gold">{fmt(order.total)}</span>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-amber-700">Note du client</p>
          {order.notes}
        </div>
      )}
    </div>
  );
}

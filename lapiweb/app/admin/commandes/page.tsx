"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useAdmin";
import type { UpdateOrderStatusRequest } from "@/types/adminTypes";

const statusConfig: Record<string, { text: string; color: string }> = {
  pending: { text: "En attente", color: "bg-yellow-50 text-yellow-700" },
  paid: { text: "Payee", color: "bg-blue-50 text-blue-600" },
  preparing: { text: "En preparation", color: "bg-st-gold/10 text-st-gold-hover" },
  ready: { text: "Prete", color: "bg-st-forest/10 text-st-forest" },
  picked_up: { text: "Recuperee", color: "bg-gray-100 text-gray-600" },
  cancelled: { text: "Annulee", color: "bg-red-50 text-red-600" },
};

const statusFlow: UpdateOrderStatusRequest["status"][] = [
  "pending", "paid", "preparing", "ready", "picked_up",
];

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

export default function AdminCommandesPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { data: orders, isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();

  const filtered = (orders ?? []).filter((o) => {
    const matchSearch =
      o.user_email.toLowerCase().includes(search.toLowerCase()) ||
      o.order_id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleStatusChange = (orderId: string, status: UpdateOrderStatusRequest["status"]) => {
    updateStatus.mutate({ orderId, data: { status } });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-bold">Commandes</h1>
        <p className="mt-1 text-[14px] text-[var(--st-warm-gray)]">{orders?.length ?? 0} commandes</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
          <input
            type="text"
            placeholder="Rechercher par email ou ID..."
            className="st-input w-full pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {[
            { key: "all", label: "Toutes" },
            { key: "pending", label: "En attente" },
            { key: "paid", label: "Payees" },
            { key: "preparing", label: "En prep." },
            { key: "ready", label: "Pretes" },
            { key: "picked_up", label: "Recuperees" },
            { key: "cancelled", label: "Annulees" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`whitespace-nowrap cursor-pointer rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                filterStatus === f.key
                  ? "bg-st-gold text-white"
                  : "bg-[var(--muted)] text-[var(--st-warm-gray)] hover:bg-st-gold/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
        </div>
      ) : (
        <div className="st-card overflow-x-auto p-0">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">
                <th className="px-5 py-3">ID</th>
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const st = statusConfig[o.status] ?? { text: o.status, color: "bg-gray-100 text-gray-600" };
                const currentIdx = statusFlow.indexOf(o.status as typeof statusFlow[number]);
                const nextStatus = currentIdx >= 0 && currentIdx < statusFlow.length - 1 ? statusFlow[currentIdx + 1] : null;
                const nextLabel = nextStatus ? statusConfig[nextStatus]?.text : null;

                return (
                  <tr key={o.order_id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-5 py-4">
                      <span className="font-mono text-[12px] font-semibold">{o.order_id.slice(0, 8)}</span>
                    </td>
                    <td className="px-5 py-4 font-medium">{o.user_email}</td>
                    <td className="px-5 py-4 text-[var(--st-warm-gray)]">{fmtDate(o.created_at)}</td>
                    <td className="px-5 py-4 font-semibold">{fmt(o.total)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${st.color}`}>{st.text}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {nextStatus && nextLabel && (
                          <button
                            onClick={() => handleStatusChange(o.order_id, nextStatus)}
                            disabled={updateStatus.isPending}
                            className="rounded-lg bg-st-gold/10 cursor-pointer px-3 py-1.5 text-[11px] font-bold text-st-gold-hover transition-colors hover:bg-st-gold/20 disabled:opacity-50"
                          >
                            {nextLabel}
                          </button>
                        )}
                        {o.status !== "cancelled" && o.status !== "picked_up" && (
                          <button
                            onClick={() => {
                              if (confirm("Annuler cette commande ?")) handleStatusChange(o.order_id, "cancelled");
                            }}
                            disabled={updateStatus.isPending}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                          >
                            Annuler
                          </button>
                        )}
                        {o.status === "picked_up" && (
                          <span className="text-[11px] text-[var(--st-warm-gray)]">Terminee</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[var(--st-warm-gray)]">
                    Aucune commande.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Search, Mail, ShoppingBag, Loader2 } from "lucide-react";
import { useClients } from "@/hooks/useAdmin";

const fmt = (cents: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function AdminClientsPage() {
  const [search, setSearch] = useState("");
  const { data: clients, isLoading } = useClients();

  const filtered = (clients ?? []).filter((c) =>
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.first_name.toLowerCase().includes(search.toLowerCase()) ||
    c.last_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-sans text-2xl font-bold">Clients</h1>
        <p className="mt-1 text-[14px] text-[var(--st-warm-gray)]">{clients?.length ?? 0} clients inscrits</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--st-warm-gray)]" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          className="st-input w-full pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-st-gold" />
        </div>
      ) : (
        <div className="st-card overflow-x-auto p-0">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-[11px] font-bold uppercase tracking-wider text-[var(--st-warm-gray)]">
                <th className="px-5 py-3">Client</th>
                <th className="px-5 py-3">Commandes</th>
                <th className="px-5 py-3">Total depense</th>
                <th className="px-5 py-3">Inscrit le</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const displayName = [c.first_name, c.last_name].filter(Boolean).join(" ") || c.email.split("@")[0];
                const initial = (c.first_name?.[0] ?? c.email[0]).toUpperCase();
                return (
                  <tr key={c.user_id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-st-gold/10 text-[12px] font-bold text-st-gold">
                          {initial}
                        </div>
                        <div>
                          <p className="font-semibold">{displayName}</p>
                          <p className="flex items-center gap-1 text-[11px] text-[var(--st-warm-gray)]">
                            <Mail className="h-3 w-3" /> {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1">
                        <ShoppingBag className="h-3.5 w-3.5 text-[var(--st-warm-gray)]" />
                        {c.order_count}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold">{fmt(c.total_spent)}</td>
                    <td className="px-5 py-4 text-[var(--st-warm-gray)]">{fmtDate(c.created_at)}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[var(--st-warm-gray)]">
                    Aucun client.
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
